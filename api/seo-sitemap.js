import {load} from './admin.js';
const base='https://ooops.agency';
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).end();
 res.setHeader('Content-Type','application/xml; charset=utf-8');
 res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
 const urls=[base+'/',base+'/services/websites.html',base+'/services/ux-ui.html',base+'/services/telegram-mini-apps.html',base+'/services/branding.html'];
 try{const {data}=await load();if(!data)return res.status(503).send('Sitemap not ready');for(const p of (data.projects||[])){if(p.published&&/^[a-zA-Z0-9_-]{1,100}$/.test(p.id||''))urls.push(base+'/portfolio/'+encodeURIComponent(p.id));}}
 catch(err){console.error('Sitemap read:',err.message);return res.status(503).send('Sitemap temporarily unavailable')}
 return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(url=>'  <url><loc>'+escape(url)+'</loc></url>').join('\n')+'\n</urlset>\n');
}