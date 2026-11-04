// Little Lives V4: one Gemini call generates a connected multi-person conversation.
// Keep GEMINI_API_KEY as a Cloudflare Secret. Add ALLOWED_ORIGIN as a text variable.
const MODEL = 'gemini-2.5-flash';
const NAMES = ['Dad','Mom','Alex','Mia'];
const ROOMS = ['living','kitchen','bedroom','bathroom'];
const ACTIONS = ['Eating','Sleeping','Relaxing','Cooking','Bathing','Talking','Playing','Reading'];
const json = (data, status, headers) => new Response(JSON.stringify(data),{status,headers});
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  const allowed=env.ALLOWED_ORIGIN||'https://reformat15.github.io';
  const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Cache-Control':'no-store'};
  if(request.method==='OPTIONS')return new Response(null,{status:origin===allowed?204:403,headers});
  if(request.method==='GET')return json({app:'Little Lives AI V4',status:'online',geminiConfigured:!!env.GEMINI_API_KEY},200,headers);
  if(request.method!=='POST')return json({error:'Method not allowed'},405,headers);
  if(origin!==allowed)return json({error:'Origin not allowed'},403,headers);
  if(!env.GEMINI_API_KEY)return json({error:'Gemini API key not configured'},503,headers);
  const size=Number(request.headers.get('Content-Length')||0);
  if(size>12000)return json({error:'Request too large'},413,headers);
  let data;
  try{data=await request.json()}catch{return json({error:'Invalid JSON'},400,headers)}
  const family=(Array.isArray(data.family)?data.family:[]).slice(0,4).map(p=>({
   name:String(p.name||'').slice(0,20),trait:String(p.trait||'').slice(0,80),
   room:String(p.room||'').slice(0,20),action:String(p.action||'').slice(0,40),
   hunger:Math.max(0,Math.min(100,Number(p.hunger)||0)),energy:Math.max(0,Math.min(100,Number(p.energy)||0)),
   happiness:Math.max(0,Math.min(100,Number(p.happiness)||0))
  })).filter(p=>NAMES.includes(p.name));
  if(family.length!==4)return json({error:'Four family members required'},400,headers);
  const history=(Array.isArray(data.history)?data.history:[]).slice(-12).map(h=>({speaker:String(h.speaker||'').slice(0,20),text:String(h.text||'').slice(0,160)}));
  const prompt=`You write believable, wholesome family conversations for a tiny 3D life simulator.
Dad: caring, practical, gentle humor. Mom: warm, thoughtful, creative. Alex: curious school-age child, playful. Mia: imaginative younger child, energetic.
All four are independent fictional characters with persistent personalities, different priorities, and relationships. They respond to what the other person actually says; no unrelated monologues.
Family state: ${JSON.stringify(family)}
Previous dialogue (do not repeat): ${JSON.stringify(history)}
Simulated time: ${String(data.time||'morning').slice(0,15)}
Create ONE coherent mini-scene with 3 or 4 sequential turns involving AT LEAST 3 DISTINCT family members. The family may talk about dinner, homework, playtime, feelings, chores, or plans. Use short conversational English sentences (max 110 characters each). Include a natural reply or follow-up in every turn after the first. Consider energy/hunger when choosing activities. Keep age-appropriate and kind; minor disagreements are fine.
Return ONLY a JSON object with exactly a "turns" array. Each turn has "character" (Dad/Mom/Alex/Mia), "room" (living/kitchen/bedroom/bathroom), "action" (Eating/Sleeping/Relaxing/Cooking/Bathing/Talking/Playing/Reading), and "dialogue". Choose the same room for speakers in a shared conversation where practical.`;
  try{
   const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{
    method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},
    body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:.85,maxOutputTokens:650}})
   });
   if(!response.ok){console.error('Gemini status',response.status);return json({error:'Gemini request failed',status:response.status},502,headers)}
   const result=await response.json();
   const raw=result.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';
   const parsed=JSON.parse(raw);
   const turns=(Array.isArray(parsed.turns)?parsed.turns:[]).slice(0,4).filter(t=>NAMES.includes(t.character)&&ROOMS.includes(t.room)&&ACTIONS.includes(t.action)&&typeof t.dialogue==='string'&&t.dialogue.trim()).map(t=>({character:t.character,room:t.room,action:t.action,dialogue:t.dialogue.slice(0,160)}));
   if(turns.length<2)return json({error:'Gemini did not produce a conversation'},502,headers);
   return json({turns},200,headers);
  }catch(e){console.error('Gemini processing failed',e.message);return json({error:'AI processing failed'},502,headers)}
 }
};
