const SUPABASE_URL="https://hqjfvqwpazqhpfgofrat.supabase.co";
const SUPABASE_KEY="sb_publishable_IpF2rscqt4NJ4Ggxh_NP5w_1-riDFG5";
let db=null;
try {
  if (window.supabase?.createClient) db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
} catch (err) { console.error("Supabase startup failed:", err); }
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const TABLES=["cad_calls","incidents","arrests","citations","warrants","bolos","port_entries","port_records","people","vehicles","evidence","media_records","companies","shifts","activity_log","watch_list","patrol_status","shared_notes","officer_messages","form_templates","traffic_stops","field_interviews","vehicle_searches","tow_records","visitor_passes","access_list","court_events","equipment_checkout","notifications","subject_alerts"];
let state=Object.fromEntries(TABLES.map(t=>[t,[]]));
let profile=JSON.parse(localStorage.getItem("fcps_profile")||"null");
let sound={enabled:localStorage.getItem("fcps_sound")!=="false",volume:Number(localStorage.getItem("fcps_volume")||.90),pack:localStorage.getItem("fcps_sound_pack")||"sonoran"};
const CAD_AUDIO={
  call_open:"https://s3.sonoransoftware.com/cad/default/call_open.mp3",
  call_edit:"https://s3.sonoransoftware.com/cad/default/call_edit.mp3",
  call_close:"https://s3.sonoransoftware.com/cad/default/call_close.mp3",
  notification:"https://s3.sonoransoftware.com/cad/default/notification1.mp3",
  signal_100:"https://s3.sonoransoftware.com/cad/default/signal_100.mp3",
  acknowledge:"https://s3.sonoransoftware.com/cad/default/tone_ack.mp3",
  timer:"https://s3.sonoransoftware.com/cad/default/timer.mp3"
};
const SONORAN_EVENT_MAP={success:"acknowledge",warning:"call_edit",critical:"signal_100",dispatch:"call_open",scan:"notification",close:"call_close",timer:"timer"};
let animationsEnabled=localStorage.getItem("fcps_animations")!=="false";
const DEPARTMENTS={FCPD:{name:"Florence City Police Department",accent:"#1675c1",prefix:"FCPD"},FCHP:{name:"Florence City Harbor Police",accent:"#0d9a98",prefix:"FCHP"},VDPS:{name:"Ventrua Department of Public Safety",accent:"#268f52",prefix:"VDPS"},HCSO:{name:"Hayward County Sheriff’s Office",accent:"#c69224",prefix:"HCSO"},JPD:{name:"Juniper Police Department",accent:"#b43b43",prefix:"JPD"}};
let activeDepartment=profile?.department||localStorage.getItem("fcps_department")||"FCPD";
let alertMemory=new Set(JSON.parse(localStorage.getItem("fcps_alerts")||"[]"));
const configs={
cad:{table:"cad_calls",title:"CAD / Dispatch",prefix:"CAD",fields:[["call_type","Call Type","text"],["priority","Priority","select","LOW|MEDIUM|HIGH|EMERGENCY"],["location","Location","text"],["caller","Caller","text"],["units","Units Assigned","text"],["status","Status","select","PENDING|DISPATCHED|ENROUTE|ON SCENE|CLOSED"],["narrative","Call Narrative","textarea"]]},
incidents:{table:"incidents",title:"Incidents",prefix:"INC",fields:[["incident_type","Incident Type","text"],["location","Location","text"],["reporting_person","Reporting Person","text"],["involved_people","Involved People","text"],["status","Status","select","DRAFT|SUBMITTED|SUPERVISOR REVIEW|APPROVED|CLOSED"],["narrative","Narrative","textarea"]]},
arrests:{table:"arrests",title:"Arrests",prefix:"ARR",fields:[["first_name","First Name","text"],["last_name","Last Name","text"],["dob","DOB","date"],["classification","Arrest Classification","select","FELONY|MISDEMEANOR|FELONY AND MISDEMEANOR|JUVENILE|WARRANT ARREST|OTHER"],["charges","Charges","textarea"],["location","Location","text"],["related_record","Related Record","text"],["disposition","Disposition","select","BOOKED|RELEASED|CITED|OTHER"],["narrative","Narrative","textarea"]]},
citations:{table:"citations",title:"Citations & Warnings",prefix:"CIT",fields:[["first_name","First Name","text"],["last_name","Last Name","text"],["plate","Plate","text"],["violation","Violation","text"],["action","Action","select","CITATION|WRITTEN WARNING|VERBAL WARNING"],["location","Location","text"],["related_record","Related Record","text"],["notes","Notes","textarea"]]},
warrants:{table:"warrants",title:"Warrants",prefix:"WAR",fields:[["first_name","First Name","text"],["last_name","Last Name","text"],["dob","DOB","date"],["warrant_type","Warrant Type","text"],["charges","Charges","textarea"],["status","Status","select","ACTIVE|SERVED|RECALLED|EXPIRED"],["notes","Notes","textarea"]]},
bolos:{table:"bolos",title:"BOLOs",prefix:"BOLO",fields:[["subject","Subject / Vehicle","text"],["plate","Plate","text"],["description","Description","textarea"],["reason","Reason","text"],["priority","Priority","select","LOW|MEDIUM|HIGH"],["status","Status","select","ACTIVE|LOCATED|CANCELLED"]]},
portrecords:{table:"port_records",title:"Port Records",prefix:"FCP",fields:[["record_type","Record Type","select","COMMERCIAL VEHICLE|VEHICLE SEARCH|DENIED ACCESS|EMPLOYEE ACCESS|GATE INCIDENT|SHIFT REPORT"],["person_name","Person / Driver","text"],["company","Company","text"],["plate","Plate","text"],["related_record","Related Entry / Record","text"],["status","Status","text"],["details","Details","textarea"]]},
people:{table:"people",title:"People Database",prefix:"PER",fields:[["first_name","First Name","text"],["middle_name","Middle Name","text"],["last_name","Last Name","text"],["dob","DOB","date"],["address","Address","text"],["phone","Phone","text"],["license_no","License Number","text"],["notes","Notes","textarea"]]},
vehicles:{table:"vehicles",title:"Vehicle Database",prefix:"VEH",fields:[["plate","Plate","text"],["state","State","text"],["year","Year","text"],["make","Make","text"],["model","Model","text"],["color","Color","text"],["owner_name","Owner","text"],["status","Status","select","VALID|STOLEN|IMPOUNDED|BOLO"],["notes","Notes","textarea"]]},
evidence:{table:"evidence",title:"Evidence",prefix:"EVD",fields:[["related_record","Related Record","text"],["item_description","Item Description","textarea"],["quantity","Quantity","text"],["collected_by","Collected By","text"],["storage_location","Storage Location","text"],["chain_status","Chain Status","select","COLLECTED|SEALED|STORED|TRANSFERRED|RELEASED"],["notes","Notes","textarea"]]},
companies:{table:"companies",title:"Companies & Contractors",prefix:"COM",fields:[["company_name","Company Name","combo"],["company_type","Type","combo"],["contact_name","Primary Contact","text"],["phone","Phone","text"],["address","Address","text"],["access_level","Access Level","combo"],["status","Status","combo"],["notes","Notes","textarea"]]},
shifts:{table:"shifts",title:"Partner & Unit Status",prefix:"SFT",fields:[["officer_name","Officer","text"],["unit_number","Unit Number","text"],["rank","Rank","combo"],["division","Division","combo"],["assignment","Assignment","combo"],["status","Unit Status","combo"],["vehicle","Assigned Vehicle","text"],["shift_start","Shift Start","datetime-local"],["shift_end","Shift End","datetime-local"],["notes","Notes","textarea"]]},
trafficstops:{table:"traffic_stops",title:"Traffic Stop Workspace",prefix:"TS",fields:[["location","Stop Location","combo"],["first_name","Driver First Name","text"],["last_name","Driver Last Name","text"],["driver_dob","Driver DOB","date"],["passengers","Passengers","textarea"],["plate","Plate","text"],["vehicle","Vehicle","text"],["insurance_status","Insurance","combo"],["registration_status","Registration","combo"],["reason","Reason for Stop","textarea"],["search_basis","Search Basis","combo"],["outcome","Outcome","combo"],["related_record","Related Report","text"],["narrative","Narrative","textarea"]]},
fieldinterviews:{table:"field_interviews",title:"Field Interview Cards",prefix:"FI",fields:[["first_name","First Name","text"],["last_name","Last Name","text"],["dob","DOB","date"],["location","Location","combo"],["reason","Reason for Contact","text"],["associates","Associates","textarea"],["vehicle_plate","Vehicle Plate","text"],["description","Description / Clothing","textarea"],["notes","Officer Notes","textarea"]]},
vehiclesearches:{table:"vehicle_searches",title:"Vehicle Search Forms",prefix:"VSR",fields:[["first_name","Driver First Name","text"],["last_name","Driver Last Name","text"],["plate","Plate","text"],["vehicle","Vehicle","text"],["location","Location","combo"],["legal_basis","Legal Basis","combo"],["consent_given","Consent Given","combo"],["areas_searched","Areas Searched","textarea"],["contraband_found","Contraband Found","textarea"],["evidence_record","Evidence Record","text"],["related_record","Related Record","text"],["notes","Notes","textarea"]]},
tows:{table:"tow_records",title:"Tow / Impound",prefix:"TOW",fields:[["plate","Plate","text"],["vehicle","Vehicle","text"],["owner_name","Owner","text"],["tow_company","Tow Company","combo"],["impound_lot","Impound Lot","text"],["reason","Tow / Hold Reason","textarea"],["inventory","Vehicle Inventory","textarea"],["status","Status","combo"],["release_to","Released To","text"],["related_record","Related Record","text"]]},
visitorpasses:{table:"visitor_passes",title:"Visitor Passes",prefix:"PASS",fields:[["first_name","Visitor First Name","text"],["last_name","Visitor Last Name","text"],["company","Company","combo"],["badge_number","Badge Number","text"],["vehicle_plate","Vehicle Plate","text"],["destination","Destination","text"],["escort_required","Escort Required","combo"],["valid_from","Valid From","datetime-local"],["expires_at","Expires","datetime-local"],["status","Status","combo"],["notes","Notes","textarea"]]},
accesslist:{table:"access_list",title:"Access / Blacklist",prefix:"ACL",fields:[["subject_type","Subject Type","combo"],["subject_name","Person / Company","text"],["plate","Plate","text"],["access_status","Access Status","combo"],["reason","Reason","textarea"],["effective_date","Effective Date","date"],["expiration_date","Expiration Date","date"],["authorized_by","Authorized By","text"],["notes","Notes","textarea"]]},
subjectalerts:{table:"subject_alerts",title:"Subject Alerts",prefix:"ALT",fields:[["first_name","First Name","text"],["last_name","Last Name","text"],["dob","DOB","date"],["plate","Plate","text"],["alert_type","Alert Type","select","OFFICER SAFETY|WANTED PERSON|TRESPASS|ACCESS DENIED|WATCH LIST|MEDICAL CAUTION|OTHER"],["severity","Severity","select","CAUTION|HIGH|CRITICAL"],["status","Status","select","ACTIVE|INACTIVE|RESOLVED"],["details","Alert Details","textarea"]]},
court:{table:"court_events",title:"Court & Case Calendar",prefix:"CRT",fields:[["related_record","Related Case","text"],["event_type","Event Type","combo"],["court_name","Court","text"],["judge","Judge","text"],["prosecutor","Prosecutor","text"],["event_at","Date & Time","datetime-local"],["location","Location","text"],["disposition","Disposition","text"],["notes","Notes","textarea"]]},
equipment:{table:"equipment_checkout",title:"Equipment Checkout",prefix:"EQ",fields:[["item_type","Item Type","combo"],["asset_number","Asset Number","text"],["serial_number","Serial Number","text"],["assigned_to","Assigned To","text"],["checkout_at","Checked Out","datetime-local"],["return_at","Returned","datetime-local"],["condition_out","Condition Out","combo"],["condition_in","Condition In","combo"],["status","Status","combo"],["notes","Notes","textarea"]]}
};
const DEFAULT_CHOICES={
 call_type:["TRAFFIC STOP","DISTURBANCE","SUSPICIOUS PERSON","VEHICLE CRASH","THEFT","BURGLARY","ASSAULT","ALARM","WELFARE CHECK","OFFICER ASSIST"],
 incident_type:["THEFT","BURGLARY","ASSAULT","DOMESTIC DISTURBANCE","TRESPASSING","FRAUD","VEHICLE CRASH","PROPERTY DAMAGE","MISSING PERSON","SUSPICIOUS ACTIVITY"],
 violation:["SPEEDING","FAILURE TO STOP","IMPROPER TURN","EXPIRED REGISTRATION","NO INSURANCE","RECKLESS OPERATION","EQUIPMENT VIOLATION","PARKING VIOLATION"],
 warrant_type:["ARREST WARRANT","BENCH WARRANT","SEARCH WARRANT","FAILURE TO APPEAR","PROBATION VIOLATION"],
 record_type:["COMMERCIAL VEHICLE","VEHICLE SEARCH","DENIED ACCESS","EMPLOYEE ACCESS","GATE INCIDENT","SHIFT REPORT","VISITOR PASS","CARGO INSPECTION"],
 company_type:["TENANT","CONTRACTOR","DELIVERY","GOVERNMENT","VENDOR","EMERGENCY SERVICE","OTHER"],
 access_level:["GENERAL","ESCORT REQUIRED","RESTRICTED","SECURE AREA","TEMPORARY","DENIED"],
 rank:["CADET","OFFICER","DEPUTY","TROOPER","CORPORAL","SERGEANT","LIEUTENANT","CAPTAIN","CHIEF","SHERIFF","DISPATCHER"],
 division:["PATROL","TRAFFIC","INVESTIGATIONS","K9","SWAT","HARBOR","GATE OPERATIONS","DISPATCH","ADMINISTRATION","FIRE","EMS"],
 assignment:["PATROL","TRAFFIC ENFORCEMENT","GATE 1","GATE 2","COMMERCIAL INSPECTION","DISPATCH CONSOLE","SUPERVISOR","COURT SECURITY","WARRANT SERVICE"],
 status:["DRAFT","SUBMITTED","SUPERVISOR REVIEW","RETURNED FOR CORRECTION","APPROVED","LOCKED","ACTIVE","INACTIVE","AVAILABLE","EN ROUTE","ON SCENE","BUSY","OUT OF SERVICE","CLOSED"],
 location:["FLORENCE CITY","PORT OF FLORENCE","MILANO ENTRANCE","MAIN GATE","JUNIPER","HAYWARD COUNTY","VENTRUA"],
 gate:["MILANO ENTRANCE","MAIN GATE","NORTH GATE","SOUTH GATE","SERVICE GATE","OTHER"],
 visitor_type:["VISITOR","EMPLOYEE","CONTRACTOR","DELIVERY","LAW ENFORCEMENT","EMERGENCY SERVICE"],
 classification:["FELONY","MISDEMEANOR","FELONY AND MISDEMEANOR","JUVENILE","WARRANT ARREST","OTHER"],
 subject_type:["PERSON","COMPANY","VEHICLE","EMPLOYEE BADGE","VISITOR PASS","OTHER"],
 access_status:["ALLOWED","WATCH LIST","RESTRICTED","ESCORT REQUIRED","SUSPENDED","DENIED","TRESPASSED"],
 insurance_status:["VALID","EXPIRED","NONE","UNVERIFIED","NOT REQUIRED"],
 registration_status:["VALID","EXPIRED","SUSPENDED","STOLEN","UNVERIFIED"],
 search_basis:["CONSENT","PROBABLE CAUSE","SEARCH INCIDENT TO ARREST","INVENTORY","WARRANT","PROBATION / PAROLE","PLAIN VIEW","OTHER","NO SEARCH"],
 outcome:["VERBAL WARNING","WRITTEN WARNING","CITATION","ARREST","TOW / IMPOUND","NO ACTION","REPORT TAKEN","OTHER"],
 legal_basis:["CONSENT","PROBABLE CAUSE","SEARCH INCIDENT TO ARREST","INVENTORY","WARRANT","PROBATION / PAROLE","PLAIN VIEW","OTHER"],
 consent_given:["YES - WRITTEN","YES - VERBAL","NO","NOT APPLICABLE"],
 tow_company:["CITY TOW","COUNTY TOW","PRIVATE TOW","OWNER REQUEST","OTHER"],
 escort_required:["YES","NO"],
 event_type:["ARRAIGNMENT","PRETRIAL","HEARING","TRIAL","SENTENCING","WARRANT REVIEW","OTHER"],
 item_type:["BODY CAMERA","RADIO","TASER","RIFLE","SHOTGUN","RADAR","ALPR","KEYS","MEDICAL KIT","OTHER"],
 condition_out:["NEW","EXCELLENT","GOOD","FAIR","DAMAGED"],
 condition_in:["EXCELLENT","GOOD","FAIR","DAMAGED","MISSING"],
 company:["PORT TENANT","CONTRACTOR","DELIVERY COMPANY","GOVERNMENT AGENCY","OTHER"]
};
const customChoiceKey=k=>`fcps_choices_${activeDepartment}_${k}`;
function choicesFor(k,inline=""){
 const custom=JSON.parse(localStorage.getItem(customChoiceKey(k))||"[]");
 const live=[];
 if(k==="company"||k==="company_name"||k==="tow_company") live.push(...(state.companies||[]).map(x=>x.company_name));
 if(k==="location") live.push(...[...(state.incidents||[]),...(state.cad_calls||[]),...(state.traffic_stops||[])].map(x=>x.location));
 if(k==="assigned_to"||k==="officer_name") live.push(...(state.shifts||[]).map(x=>x.officer_name),profile?.name);
 return [...new Set([...(inline?inline.split("|"):[]),...(DEFAULT_CHOICES[k]||[]),...live,...custom].filter(Boolean).map(norm))];
}
function rememberChoice(k,v){v=norm(v);if(!v)return;let a=JSON.parse(localStorage.getItem(customChoiceKey(k))||"[]");if(!a.includes(v)){a.push(v);localStorage.setItem(customChoiceKey(k),JSON.stringify(a.sort()))}}
const recordNo=p=>`${activeDepartment}-${p}-${String(Date.now()).slice(-7)}`;
// All operational records are visible across every department. The selected
// department now controls record ownership, branding, and new-record creation only.
const deptRows=t=>(state[t]||[]);
const norm=v=>String(v||"").trim().replace(/\s+/g," ").toUpperCase();
function personName(r={}){return [r.first_name,r.middle_name,r.last_name].filter(Boolean).join(" ").trim()||r.full_name||r.person_name||r.arrestee||r.driver_name||r.visitor_name||r.name||r.subject_name||""}
function splitName(v=""){const a=String(v).trim().split(/\s+/).filter(Boolean);return {first_name:a[0]||"",last_name:a.length>1?a[a.length-1]:""}}
function samePerson(a,b){const af=norm(a.first_name||splitName(personName(a)).first_name),al=norm(a.last_name||splitName(personName(a)).last_name),bf=norm(b.first_name||splitName(personName(b)).first_name),bl=norm(b.last_name||splitName(personName(b)).last_name);if(!af||!al||!bf||!bl||af!==bf||al!==bl)return false;const ad=String(a.dob||a.driver_dob||""),bd=String(b.dob||b.driver_dob||"");return !ad||!bd||ad===bd}
const splitPeople=v=>String(v||"").split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
async function ensurePerson(fullName,dob="",sourceRecord="",extra={}){
 if(!db||!fullName?.trim())return null;
 const name=fullName.trim(), n=norm(name), d=String(dob||"").trim();
 let parts=splitName(name); let existing=state.people.find(p=>samePerson(p,{...parts,dob:d}));
 if(existing){
  const patch={};
  if(d&&!existing.dob)patch.dob=d;
  for(const k of ["address","phone","license_no"]){if(extra[k]&&!existing[k])patch[k]=extra[k]}
  if(Object.keys(patch).length)await db.from("people").update(patch).eq("id",existing.id);
  return existing.id;
 }
 const obj={record_no:recordNo("PER"),full_name:name,dob:d||null,address:extra.address||null,phone:extra.phone||null,license_no:extra.license_no||null,notes:sourceRecord?`Automatically created from ${sourceRecord}`:"Automatically created from a record",status:d?"VERIFIED":"UNVERIFIED",department:activeDepartment,created_by:profile?.name||"SYSTEM",unit:profile?.unit||""};
 const {data,error}=await db.from("people").insert(obj).select("id").single();
 if(error){console.warn("Automatic person creation failed",error);return null}
 log("AUTO-CREATED","People Database",obj.record_no,`${name} from ${sourceRecord}`);return data?.id||null;
}
async function ensureVehicle(plate,sourceRecord="",extra={}){
 if(!db||!plate?.trim())return null;
 const clean=norm(plate).replace(/\s/g,"");
 let existing=state.vehicles.find(v=>norm(v.plate).replace(/\s/g,"")===clean);
 if(existing){
  const patch={};for(const k of ["state","year","make","model","color","owner_name"]){if(extra[k]&&!existing[k])patch[k]=extra[k]}
  if(Object.keys(patch).length)await db.from("vehicles").update(patch).eq("id",existing.id);
  return existing.id;
 }
 const obj={record_no:recordNo("VEH"),plate:clean,state:extra.state||null,year:extra.year||null,make:extra.make||null,model:extra.model||null,color:extra.color||null,owner_name:extra.owner_name||null,status:"VALID",department:activeDepartment,notes:sourceRecord?`Automatically created from ${sourceRecord}`:"Automatically created from a record",created_by:profile?.name||"SYSTEM",unit:profile?.unit||""};
 const {data,error}=await db.from("vehicles").insert(obj).select("id").single();
 if(error){console.warn("Automatic vehicle creation failed",error);return null}
 log("AUTO-CREATED","Vehicle Database",obj.record_no,`${clean} from ${sourceRecord}`);return data?.id||null;
}
async function autoLinkRecord(table,obj){
 const personFields={cad_calls:["caller"],incidents:["reporting_person","involved_people"],arrests:["arrestee"],citations:["person_name"],warrants:["person_name"],bolos:["subject"],port_records:["person_name"]};
 for(const field of personFields[table]||[]){for(const name of splitPeople(obj[field]))await ensurePerson(name,obj.dob||"",obj.record_no)}
 if(obj.plate)await ensureVehicle(obj.plate,obj.record_no,{owner_name:obj.person_name||obj.arrestee||obj.name||""});
}
function linkedHistory(record,table){
 const name=norm(record.full_name||record.name||record.person_name||record.arrestee||record.owner_name||"");
 const plate=norm(record.plate||"").replace(/\s/g,"");
 if(!name&&!plate)return [];
 const skip=new Set(["people","vehicles","activity_log","watch_list","patrol_status","shared_notes","officer_messages","form_templates"]), found=[];
 for(const t of TABLES){if(skip.has(t))continue;for(const r of state[t]){
  const names=[r.name,r.full_name,r.person_name,r.arrestee,r.reporting_person,r.involved_people,r.subject,r.subject_name,r.owner_name,r.caller,r.driver_name,r.passengers,r.associates,r.release_to].map(norm);
  const rp=norm(r.plate||r.vehicle_plate||"").replace(/\s/g,"");
  if((name&&names.some(x=>x&&(x===name||x.split(/[,;\n]+/).map(norm).includes(name))))||(plate&&rp===plate))found.push({...r,_table:t});
 }}
 return found.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
}
function findRecordByNumber(value){
 const target=norm(value).trim();if(!target)return null;
 for(const t of TABLES){const row=(state[t]||[]).find(r=>norm(r.record_no)===target);if(row)return {...row,_table:t}}
 return null;
}
function renderRecordField(key,value){
 const label=esc(key.replaceAll("_"," ").toUpperCase());
 const raw=String(value??"");
 const exact=findRecordByNumber(raw);
 if(exact)return `<p><b>${label}</b><br><button type="button" class="attached-report-link" data-record-table="${esc(exact._table)}" data-id="${esc(exact.id)}">${esc(raw)} · OPEN ATTACHED REPORT</button></p>`;
 const recordPattern=/\b[A-Z]{2,12}(?:-[A-Z]{2,8})?-\d{3,}\b/g;
 const matches=[...new Set(raw.match(recordPattern)||[])];
 if(matches.length){
  let html=esc(raw);
  for(const rec of matches){const found=findRecordByNumber(rec);if(found)html=html.replace(esc(rec),`<button type="button" class="inline-record-link" data-record-table="${esc(found._table)}" data-id="${esc(found.id)}">${esc(rec)}</button>`)}
  return `<p><b>${label}</b><br>${html}</p>`;
 }
 return `<p><b>${label}</b><br>${esc(value)}</p>`;
}

const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const fmt=d=>d?new Date(d).toLocaleString():"—"; const elapsed=d=>Math.max(0,Math.floor((Date.now()-new Date(d))/60000));
function toast(t){$("#toast").textContent=t;$("#toast").classList.add("show");setTimeout(()=>$("#toast").classList.remove("show"),2200)}
function play(type){
 if(!sound.enabled)return;
 if(sound.pack==="sonoran"){
  const key=SONORAN_EVENT_MAP[type]||type;
  const src=CAD_AUDIO[key];
  if(!src)return;
  const audio=new Audio(src);
  audio.preload="auto";
  audio.volume=Math.max(0,Math.min(1,sound.volume));
  audio.play().catch(err=>{console.warn("CAD sound playback failed; using fallback tone.",err);playSynth(type)});
  return;
 }
 playSynth(type);
}
function playSynth(type){
 const A=window.AudioContext||window.webkitAudioContext;
 if(!A)return;
 const a=new A(),master=a.createGain();
 master.gain.value=Math.min(1,sound.volume*.9);
 master.connect(a.destination);
 const profiles={
  console:{
   success:[{f:1046,d:.045,v:.18},{f:1318,d:.07,v:.14,g:.018}],
   warning:[{f:740,d:.08,v:.18},{f:622,d:.11,v:.16,g:.035}],
   critical:[{f:523,d:.075,v:.2},{f:392,d:.075,v:.2,g:.035},{f:523,d:.12,v:.18,g:.035}],
   dispatch:[{f:1200,d:.028,v:.13},{f:1800,d:.025,v:.11,g:.012},{f:980,d:.055,v:.14,g:.016}],
   scan:[{f:1600,d:.025,v:.12},{f:1980,d:.035,v:.10,g:.012}],
   close:[{f:880,d:.05,v:.13},{f:660,d:.07,v:.11,g:.02}],timer:[{f:700,d:.08,v:.16},{f:700,d:.08,v:.16,g:.08}]
  },
  mdc:{
   success:[{f:900,d:.04,v:.14},{f:1120,d:.06,v:.12,g:.015}],
   warning:[{f:610,d:.07,v:.16},{f:480,d:.10,v:.14,g:.025}],
   critical:[{f:440,d:.06,v:.17},{f:330,d:.06,v:.17,g:.025},{f:440,d:.10,v:.16,g:.025}],
   dispatch:[{f:1350,d:.022,v:.12},{f:900,d:.022,v:.12,g:.01},{f:1600,d:.022,v:.11,g:.01},{f:1050,d:.05,v:.12,g:.012}],
   scan:[{f:1450,d:.02,v:.10},{f:1750,d:.03,v:.09,g:.01}],close:[{f:1000,d:.04,v:.12},{f:700,d:.06,v:.10,g:.015}],timer:[{f:760,d:.07,v:.14},{f:760,d:.07,v:.14,g:.06}]
  },
  subdued:{success:[{f:880,d:.055,v:.10}],warning:[{f:520,d:.09,v:.11}],critical:[{f:390,d:.11,v:.13},{f:390,d:.11,v:.13,g:.06}],dispatch:[{f:950,d:.045,v:.10},{f:1150,d:.05,v:.09,g:.018}],scan:[{f:1250,d:.03,v:.08}],close:[{f:720,d:.06,v:.09}],timer:[{f:600,d:.09,v:.10}]},
  silent:{success:[],warning:[],critical:[],dispatch:[],scan:[],close:[],timer:[]}
 };
 const notes=(profiles[sound.pack]||profiles.console)[type]||[];
 let t=a.currentTime+.01;
 notes.forEach(n=>{const o=a.createOscillator(),gain=a.createGain(),filter=a.createBiquadFilter();o.type='sine';o.frequency.setValueAtTime(n.f,t);filter.type='lowpass';filter.frequency.value=2600;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(n.v,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+n.d);o.connect(filter);filter.connect(gain);gain.connect(master);o.start(t);o.stop(t+n.d+.01);t+=n.d+(n.g??.02)});
 setTimeout(()=>a.close().catch(()=>{}),Math.max(250,(t-a.currentTime+0.1)*1000));
}
function log(action,module,record_no,details=""){if(!db)return;db.from("activity_log").insert({officer:profile?.name||"UNKNOWN",unit:profile?.unit||"",department:activeDepartment,action,module,record_no,details})}
async function deleteRecord(table,id){
 if(!db)return toast("Database connection is unavailable.");
 const row=(state[table]||[]).find(x=>String(x.id)===String(id));
 if(!row)return toast("Record could not be found.");
 const label=row.record_no||row.full_name||row.name||row.title||row.plate||"this record";
 if(!confirm(`Permanently remove ${label}? This will disappear for every user and cannot be undone.`))return;
 const typed=prompt(`Type DELETE to permanently remove ${label}.`);
 if(typed!=="DELETE")return toast("Deletion cancelled.");
 const audit={officer:profile?.name||"UNKNOWN",unit:profile?.unit||"",department:row.department||activeDepartment,action:"DELETED",module:table,record_no:row.record_no||"",details:`Permanently removed ${label}`};
 if(table!=="activity_log")await db.from("activity_log").insert(audit);
 const {error}=await db.from(table).delete().eq("id",id);
 if(error)return toast(error.message);
 $("#modal")?.classList.remove("show");
 play("close");toast(`${label} removed`);
}

function showPage(id){
 $$(".page").forEach(x=>x.classList.toggle("active",x.id===id));$$(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===id));
 $("#pageTitle").textContent=configs[id]?.title||({dashboard:"Patrol Home",intelligence:"Intelligence Center",forms:"Form Builder",gate:"Gate Entry / Exit",occupancy:"Live Occupancy",media:"Bodycam & Media",search:"Universal Search",activity:"Activity Log",statistics:"Statistics & Analytics",settings:"Settings",companies:"Companies & Contractors",shifts:"Shift & Unit Board"}[id]||id);
 if(configs[id])renderModule(id);
}
$$(".nav").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
function fieldHTML([key,label,type,options]){
 if(type==="textarea")return `<label class="wide">${label}<textarea name="${key}"></textarea></label>`;
 if(type==="date"||type==="datetime-local")return `<label>${label}<input name="${key}" type="${type}"></label>`;
 const comboKeys=new Set(["call_type","incident_type","violation","warrant_type","record_type","company_type","access_level","rank","division","assignment","status","location","gate","visitor_type","classification"]);
 if(type==="combo"||comboKeys.has(key)){
  const vals=choicesFor(key,options||"");
  return `<label>${label}<div class="smart-combo" data-combo-key="${key}"><input name="${key}" autocomplete="off" aria-haspopup="listbox" aria-expanded="false"><button class="combo-toggle" type="button" tabindex="-1" aria-label="Show choices">▾</button><div class="combo-menu" role="listbox">${vals.map(x=>`<button type="button" class="combo-option" data-value="${esc(x)}">${esc(x)}</button>`).join("")}</div></div><small class="field-help">Choose a suggestion or type your own.</small></label>`;
 }
 if(type==="select")return `<label>${label}<select name="${key}">${options.split("|").map(x=>`<option>${x}</option>`).join("")}</select></label>`;
 return `<label>${label}<input name="${key}" type="${type||"text"}"></label>`;
}
function initSmartCombos(root=document){
 root.querySelectorAll(".smart-combo").forEach(combo=>{
  const input=combo.querySelector("input"),menu=combo.querySelector(".combo-menu"),toggle=combo.querySelector(".combo-toggle");
  const options=[...combo.querySelectorAll(".combo-option")];
  const open=()=>{menu.classList.add("show");input.setAttribute("aria-expanded","true");filter()};
  const close=()=>{menu.classList.remove("show");input.setAttribute("aria-expanded","false")};
  const filter=()=>{const q=norm(input.value);let shown=0;options.forEach(o=>{const ok=!q||norm(o.dataset.value).includes(q);o.hidden=!ok;if(ok)shown++});menu.classList.toggle("no-results",shown===0)};
  input.addEventListener("focus",open);
  input.addEventListener("click",open);
  input.addEventListener("input",()=>{open();filter()});
  input.addEventListener("keydown",e=>{if(e.key==="Escape")close();if(e.key==="ArrowDown"){e.preventDefault();open();const first=options.find(o=>!o.hidden);first?.focus()}});
  toggle.addEventListener("click",()=>menu.classList.contains("show")?close():open());
  options.forEach((o,i)=>{
   o.addEventListener("mousedown",e=>e.preventDefault());
   o.addEventListener("click",()=>{input.value=o.dataset.value;input.dispatchEvent(new Event("change",{bubbles:true}));close();input.focus()});
   o.addEventListener("keydown",e=>{if(e.key==="ArrowDown"){e.preventDefault();options.slice(i+1).find(x=>!x.hidden)?.focus()}if(e.key==="ArrowUp"){e.preventDefault();(options.slice(0,i).reverse().find(x=>!x.hidden)||input).focus()}if(e.key==="Escape"){close();input.focus()}});
  });
  document.addEventListener("mousedown",e=>{if(!combo.contains(e.target))close()});
 });
}
function renderModule(id){
 if(id==="portrecords")return renderPortRecordsPage();
 const c=configs[id],el=$("#"+id),rows=deptRows(c.table);
 el.innerHTML=`<div class="grid two"><article class="panel"><div class="panel-head"><h3>New ${c.title.replace(/s$/,"")}</h3></div>
 <form class="form generic-form" data-module="${id}">${c.fields.map(fieldHTML).join("")}<button class="primary">Save Record</button></form></article>
 <article class="panel"><div class="panel-head"><h3>All Department Records</h3><span>${rows.length} regional total</span></div><div class="record-list">${rows.map(recordCard).join("")||'<div class="empty">No records.</div>'}</div></article></div>`;
 initSmartCombos(el); el.querySelector("form").onsubmit=saveGeneric; el.querySelectorAll(".record").forEach(r=>r.onclick=()=>openRecord(c.table,r.dataset.id));
}

function renderPortRecordsPage(){
 const c=configs.portrecords,el=$("#portrecords"),manual=deptRows("port_records"),entries=deptRows("port_entries");
 el.innerHTML=`<div class="grid two"><article class="panel"><div class="panel-head"><h3>New Port Record</h3></div>
 <form class="form generic-form" data-module="portrecords">${c.fields.map(fieldHTML).join("")}<button class="primary">Save Record</button></form></article>
 <article class="panel"><div class="panel-head"><h3>Gate Entry History</h3><span>${entries.length} regional total</span></div><div class="record-list">${entries.map(r=>`<div class="record gate-history-record" data-id="${r.id}"><div class="record-head"><b>${esc(r.record_no||"GATE ENTRY")}</b><span class="tag ${recordStatusClass(r.status||"PENDING")}">${esc(r.status||"PENDING")}</span></div><p><strong>${esc(r.department||"REGIONAL")}</strong> · ${esc(r.name||[r.first_name,r.last_name].filter(Boolean).join(" ")||"Unknown visitor")} · ${esc(r.plate||"NO PLATE")} · ${fmt(r.time_in||r.created_at)}</p></div>`).join("")||'<div class="empty">No gate entries.</div>'}</div></article></div>
 <article class="panel"><div class="panel-head"><h3>Other Port Records</h3><span>${manual.length} regional total</span></div><div class="record-list">${manual.map(recordCard).join("")||'<div class="empty">No additional port records.</div>'}</div></article>`;
 initSmartCombos(el);el.querySelector("form").onsubmit=saveGeneric;
 el.querySelectorAll(".gate-history-record").forEach(r=>r.onclick=()=>openRecord("port_entries",r.dataset.id));
 el.querySelectorAll(".record:not(.gate-history-record)").forEach(r=>r.onclick=()=>openRecord("port_records",r.dataset.id));
}

function recordStatusClass(v){v=norm(v);if(/EMERGENCY|FELONY|ACTIVE WARRANT|STOLEN|DENIED|OVERDUE/.test(v))return "red pulse-alert";if(/MISDEMEANOR|HIGH|SEARCH|REVIEW/.test(v))return "amber";if(/CITATION|PENDING|CAUTION/.test(v))return "yellow";if(/APPROVED|CLOSED|SERVED|CLEAR|VALID/.test(v))return "green";if(/JUVENILE|RESTRICTED/.test(v))return "purple";return "blue"}
function recordCard(r){let title=r.record_no||"RECORD", sub=personName(r)||r.subject||r.call_type||r.incident_type||r.item_description||r.record_type||r.plate||"Untitled";const dept=r.department||"REGIONAL";return `<div class="record" data-id="${r.id}"><div class="record-head"><b>${esc(title)}</b><span class="tag ${recordStatusClass(r.classification||r.action||r.status||r.priority||r.chain_status||"ACTIVE")}">${esc(r.classification||r.action||r.status||r.priority||r.chain_status||"ACTIVE")}</span></div><p><strong>${esc(dept)}</strong> · ${esc(sub)} · ${fmt(r.created_at)}</p></div>`}
async function saveGeneric(e){
 e.preventDefault();if(!db)return toast("Database connection is unavailable. Refresh the page.");const id=e.target.dataset.module,c=configs[id],f=new FormData(e.target),obj={record_no:recordNo(c.prefix),department:activeDepartment,created_by:profile.name,unit:profile.unit};
 c.fields.forEach(([k,,type])=>{
  const raw=(f.get(k)||"").trim();
  // PostgreSQL date/timestamp columns reject an empty string. Store NULL when
  // the officer leaves an optional date or date/time field blank.
  obj[k]=(type==="date"||type==="datetime-local")?(raw||null):raw;
 });
 c.fields.forEach(([k,,type])=>{if((type==="combo"||DEFAULT_CHOICES[k])&&obj[k])rememberChoice(k,obj[k])});
 const duplicate=deptRows(c.table).find(r=>{if(c.table==="people")return samePerson(r,obj);if(c.table==="vehicles")return norm(r.plate).replace(/\s/g,"")===norm(obj.plate).replace(/\s/g,"");if(c.table==="companies")return norm(r.company_name)===norm(obj.company_name);return false});
 if(duplicate&&!confirm(`Possible duplicate found: ${duplicate.record_no}. Save another record anyway?`))return;
 if(obj.plate)obj.plate=norm(obj.plate).replace(/\s/g,"");
 const joined=[obj.first_name,obj.last_name].filter(Boolean).join(" ").trim();
 if(joined){if(c.table==="people")obj.full_name=joined;if(c.table==="arrests")obj.arrestee=joined;if(["citations","warrants","field_interviews"].includes(c.table))obj.person_name=joined;if(["traffic_stops","vehicle_searches"].includes(c.table))obj.driver_name=joined;if(c.table==="visitor_passes")obj.visitor_name=joined;}
 const {error}=await db.from(c.table).insert(obj);
 if(error)return toast(error.message);await autoLinkRecord(c.table,obj);await checkAndBroadcastSubjectAlerts(obj,c.table);play(c.table==="evidence"?"scan":c.table==="cad_calls"?"dispatch":"success");log("CREATED",c.title,obj.record_no);e.target.reset();toast(`${obj.record_no} created`);
}
function workflowButtons(table,r){
 const flow=["DRAFT","SUBMITTED","SUPERVISOR REVIEW","RETURNED FOR CORRECTION","APPROVED","LOCKED"];
 if(!["incidents","arrests","citations","evidence"].includes(table))return "";
 return `<div class="modal-actions"><button class="secondary" onclick="window.print()">Print Record</button>${flow.map(x=>`<button class="workflow-btn" data-table="${table}" data-id="${r.id}" data-status="${x}">${x}</button>`).join("")}</div>`;
}
function openRecord(table,id){const r=(state[table]||[]).find(x=>String(x.id)===String(id));if(!r)return;const history=(table==="people"||table==="vehicles")?linkedHistory(r,table):[];const audits=state.activity_log.filter(a=>a.record_no===r.record_no).slice(0,25);$("#modalContent").innerHTML=`<div class="print-header"><h2>${esc(r.record_no||"Record")}</h2><p>${esc(DEPARTMENTS[r.department]?.name||r.department||"")}</p></div>${workflowButtons(table,r)}<div class="record-delete-row"><button id="deleteCurrentRecord" class="danger-button" type="button">Remove Record</button></div><div class="record-detail-grid">${Object.entries(r).filter(([k])=>!["id"].includes(k)).map(([k,v])=>renderRecordField(k,v)).join("")}</div>${history.length?`<hr><h3>${table==="people"?"Attached Reports & Contact History":"Linked Record History"}</h3><div class="record-list">${history.map(x=>`<div class="record" data-record-table="${esc(x._table)}" data-id="${esc(x.id)}"><b>${esc(x.record_no||x._table)}</b><p>${esc(x._table.replaceAll("_"," ").toUpperCase())} · ${fmt(x.created_at)}</p></div>`).join("")}</div>`:""}${audits.length?`<hr><h3>Audit History</h3><div class="timeline">${audits.map(a=>`<div class="timeline-item"><b>${esc(a.officer)}</b> ${esc(a.action)}<br><small>${fmt(a.created_at)} ${a.details?"· "+esc(a.details):""}</small></div>`).join("")}</div>`:""}`;$("#modal").classList.add("show");$("#deleteCurrentRecord").onclick=()=>deleteRecord(table,id);$$('.workflow-btn').forEach(b=>b.onclick=()=>updateWorkflow(b.dataset.table,b.dataset.id,b.dataset.status));$$('#modalContent [data-record-table]').forEach(el=>el.onclick=()=>openRecord(el.dataset.recordTable,el.dataset.id))}
async function updateWorkflow(table,id,status){if(!db)return;const r=state[table].find(x=>x.id===id);if(!r)return;const field="status";const old=r[field]||"";const {error}=await db.from(table).update({[field]:status}).eq("id",id);if(error)return toast(error.message);log("STATUS CHANGED",table,r.record_no,`${old||"NONE"} → ${status}`);play(status==="APPROVED"?"success":status==="RETURNED FOR CORRECTION"?"warning":"scan");toast(`${r.record_no} changed to ${status}`);$("#modal").classList.remove("show")}
$("#modalClose").onclick=()=>$("#modal").classList.remove("show");

let gateStep=1;
const GATE_STEPS=8;
function gateFormObject(){
 const form=$("#gateForm"),fd=new FormData(form),o={};
 for(const [k,v] of fd.entries()){
  if(k.startsWith("check_")) continue;
  o[k]=(v||"").trim?.()??v;
 }
 o.checklist={};
 $$('[name^="check_"]',form).forEach(x=>o.checklist[x.name]=x.checked);
 o.checklist_comments=fd.get("checklist_comments")||"";
 return o;
}
function setGateStep(n){
 gateStep=Math.max(1,Math.min(GATE_STEPS,n));
 $$('.wizard-step').forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===gateStep));
 $$('.wizard-tab').forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===gateStep));
 $("#gateProgress").textContent=`STEP ${gateStep} OF ${GATE_STEPS}`;
 $("#gatePrev").disabled=gateStep===1;
 $("#gateNext").classList.toggle('hidden',gateStep===GATE_STEPS);
 $("#gateSubmit").classList.toggle('hidden',gateStep!==GATE_STEPS);
}
function gateSummary(){
 const o=gateFormObject(),name=[o.first_name,o.last_name].filter(Boolean).join(' ')||'Not entered';
 const checked=Object.values(o.checklist||{}).filter(Boolean).length,total=Object.keys(o.checklist||{}).length;
 $("#gateLiveSummary").classList.remove('empty');
 $("#gateLiveSummary").innerHTML=`<dl><dt>Visitor</dt><dd>${esc(name)}</dd><dt>Type</dt><dd>${esc(o.visitor_type||'—')}</dd><dt>Company</dt><dd>${esc(o.company||o.carrier_company||'—')}</dd><dt>Purpose</dt><dd>${esc(o.purpose_of_visit||'—')}</dd><dt>Destination</dt><dd>${esc(o.destination||o.dock_destination||o.work_area||'—')}</dd><dt>Vehicle</dt><dd>${esc([o.vehicle_year,o.vehicle_make,o.vehicle_model,o.vehicle_color].filter(Boolean).join(' ')||'—')}</dd><dt>Plate</dt><dd>${esc([o.plate,o.plate_state].filter(Boolean).join(' / ')||'—')}</dd><dt>Checklist</dt><dd>${checked}/${total} complete</dd><dt>Decision</dt><dd>${esc(o.status||'PENDING')}</dd></dl>`;
 const flags=[];
 if(o.id_status&&o.id_status!=='VALID')flags.push(`ID ${o.id_status}`);
 if(o.inspection_compliance==='NO'||o.search_decision==='REFUSED')flags.push('INSPECTION REFUSAL');
 if(o.weapons_declared&&o.weapons_declared!=='NO')flags.push('WEAPONS DECLARED');
 if(o.dangerous_materials&&o.dangerous_materials!=='NO')flags.push('DANGEROUS MATERIALS');
 if(o.prohibited_items&&o.prohibited_items!=='NO')flags.push('PROHIBITED / CONTROLLED ITEM ANSWER');
 if(o.hazmat==='YES')flags.push('HAZMAT');
 if(o.status==='DENIED'||o.status==='RESTRICTED')flags.push(o.status);
 const risk=$("#gateRisk");risk.className=`gate-risk ${flags.length>=2?'risk-high':flags.length?'risk-medium':'risk-low'}`;risk.querySelector('strong').textContent=flags.length?flags.join(' · '):'NO FLAGS';
 $(".trailer-field").classList.toggle('hidden',o.has_trailer!=='YES');
}
async function gateAlertCheck(showPopup=true){
 const o=gateFormObject();o.name=[o.first_name,o.last_name].filter(Boolean).join(' ');o.driver_name=o.name;o.dob=o.dob||null;o.plate=(o.plate||'').toUpperCase();
 const matches=collectSubjectMatches(o);
 const box=$("#gateAlertPreview");
 if(!matches.length){box.className='gate-alert-preview no-match';box.innerHTML='<b>NO ACTIVE MATCHES FOUND</b><br><small>Checked warrants, BOLOs, watch list, access restrictions, subject alerts, and plates.</small>';play('success');return []}
 box.className='gate-alert-preview has-match';box.innerHTML=`<b>${matches.length} ALERT MATCH${matches.length===1?'':'ES'} FOUND</b>${matches.map(m=>`<button type="button" class="attached-report-link" data-record-table="${esc(m.table)}" data-id="${esc(m.row.id)}">${esc(m.reason)} · ${esc(m.row.record_no||m.table)}</button>`).join('')}`;
 $$('#gateAlertPreview [data-record-table]').forEach(el=>el.onclick=()=>openRecord(el.dataset.recordTable,el.dataset.id));
 play('critical');if(showPopup)showSubjectAlertModal(matches,o,'GATE SCREENING');return matches;
}
function validateGateStep(){
 const step=$(`.wizard-step[data-step="${gateStep}"]`);const invalid=[...step.querySelectorAll('[required]')].find(x=>!x.value.trim());if(invalid){invalid.focus();toast(`Complete ${invalid.closest('label')?.childNodes[0]?.textContent?.trim()||'the required field'}`);return false}return true;
}
$("#gateNext").onclick=()=>{if(validateGateStep())setGateStep(gateStep+1)};
$("#gatePrev").onclick=()=>setGateStep(gateStep-1);
$$('.wizard-tab').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.step);if(n<=gateStep||validateGateStep())setGateStep(n)});
$("#gateForm").addEventListener('input',gateSummary);$("#gateForm").addEventListener('change',gateSummary);
$("#runGateAlertCheck").onclick=()=>gateAlertCheck(true);
async function saveGateEntry(finalize=true){
 if(!db)return toast('Database connection is unavailable. Refresh the page.');
 const form=$("#gateForm"),raw=gateFormObject();
 if(finalize&&!form.reportValidity())return;
 const o={...raw};if(!o.expected_departure)o.expected_departure=null;o.record_no=recordNo('FCP-ENT');o.time_in=new Date().toISOString();o.created_by=profile.name;o.unit=profile.unit;o.department=activeDepartment;o.plate=(o.plate||'').toUpperCase();o.name=[o.first_name,o.last_name].filter(Boolean).join(' ').trim();o.vehicle=[o.vehicle_year,o.vehicle_make,o.vehicle_model,o.vehicle_color].filter(Boolean).join(' ');o.status=finalize?(o.status||'PENDING'):'DRAFT';
 o.screening_data={...raw,checklist:raw.checklist};delete o.checklist;
 const matches=await gateAlertCheck(false);o.alert_match_count=matches.length;o.alert_check_at=new Date().toISOString();
 const {error}=await db.from('port_entries').insert(o);if(error)return toast(error.message);
 await ensurePerson(o.name,o.dob||'',o.record_no);await ensureVehicle(o.plate,o.record_no,{owner_name:o.name,model:o.vehicle});await checkAndBroadcastSubjectAlerts(o,'port_entries');
 play(o.status==='DENIED'?'warning':'success');log(finalize?'GATE ENTRY':'GATE DRAFT','Port Operations',o.record_no,`${o.name} ${o.plate}`);form.reset();setGateStep(1);gateSummary();$("#gateAlertPreview").className='gate-alert-preview empty';$("#gateAlertPreview").textContent='No alert check has been run yet.';toast(`${o.record_no} ${finalize?'created':'saved as draft'}`);
}
$("#gateSaveDraft").onclick=()=>saveGateEntry(false);
$("#gateForm").onsubmit=async e=>{e.preventDefault();await saveGateEntry(true)};
$("#exitForm").onsubmit=async e=>{e.preventDefault();if(!db)return toast("Database connection is unavailable. Refresh the page.");let f=new FormData(e.target),id=$("#exitRecord").value;if(!id)return;let o={time_out:new Date().toISOString(),exit_gate:f.get("exit_gate"),exit_notes:f.get("notes"),exit_officer:profile.name,business_completed:f.get('business_completed'),unusual_occurred:f.get('unusual_occurred'),cargo_verified:f.get('cargo_verified'),exit_seal_intact:f.get('exit_seal_intact')};
 const rec=state.port_entries.find(x=>x.id===id),{error}=await db.from("port_entries").update(o).eq("id",id);if(error)return toast(error.message);play("close");log("EXIT","Port Operations",rec.record_no);e.target.reset();toast("Exit recorded")};
setGateStep(1);gateSummary();

function collectSubjectMatches(subject={}){
 const matches=[];
 const plate=norm(subject.plate||subject.vehicle_plate||"").replace(/\s/g,"");
 const add=(table,row,reason,severity="HIGH")=>{if(!matches.some(m=>m.table===table&&m.row.id===row.id))matches.push({table,row,reason,severity})};
 state.subject_alerts.filter(x=>norm(x.status)==="ACTIVE").forEach(x=>{if(samePerson(subject,x)||(plate&&norm(x.plate).replace(/\s/g,"")===plate))add("subject_alerts",x,x.alert_type||"SUBJECT ALERT",x.severity||"HIGH")});
 state.warrants.filter(x=>norm(x.status)==="ACTIVE").forEach(x=>{if(samePerson(subject,x))add("warrants",x,`ACTIVE WARRANT: ${x.charges||x.warrant_type||"WARRANT"}`,"CRITICAL")});
 state.watch_list.filter(x=>norm(x.status)==="ACTIVE").forEach(x=>{const np=splitName(x.name||"");if(samePerson(subject,{...x,...np})||(plate&&norm(x.plate).replace(/\s/g,"")===plate))add("watch_list",x,x.reason||"WATCH LIST MATCH","CRITICAL")});
 state.access_list.filter(x=>["DENIED","RESTRICTED","BLACKLISTED"].includes(norm(x.access_status))).forEach(x=>{const np=splitName(x.subject_name||"");if(samePerson(subject,{...x,...np})||(plate&&norm(x.plate).replace(/\s/g,"")===plate))add("access_list",x,`ACCESS ${x.access_status}: ${x.reason||"RESTRICTION"}`,"CRITICAL")});
 state.bolos.filter(x=>norm(x.status)==="ACTIVE").forEach(x=>{const np=splitName(x.subject||"");if(samePerson(subject,{...x,...np})||(plate&&norm(x.plate).replace(/\s/g,"")===plate))add("bolos",x,x.reason||"ACTIVE BOLO",norm(x.priority)==="HIGH"?"CRITICAL":"HIGH")});
 return matches;
}
function showSubjectAlert(subject,matches,source="Record"){
 if(!matches.length)return;
 const name=personName(subject)||"UNKNOWN SUBJECT", plate=subject.plate||subject.vehicle_plate||"";
 $("#modalContent").innerHTML=`<div class="subject-alert-banner"><h2>⚠ SUBJECT ALERT MATCH</h2><p>${esc(name)}${plate?` · ${esc(plate)}`:""}</p></div><p><b>Entered during:</b> ${esc(source.replaceAll("_"," ").toUpperCase())}</p><div class="record-list">${matches.map(m=>`<div class="record alert-match" data-record-table="${esc(m.table)}" data-id="${esc(m.row.id)}"><div class="record-head"><b>${esc(m.reason)}</b><span class="tag ${norm(m.severity)==="CRITICAL"?"red":"amber"}">${esc(m.severity)}</span></div><p>${esc(m.row.record_no||m.table)} · Click to open</p></div>`).join("")}</div><button id="ackSubjectAlert" class="primary" type="button">ACKNOWLEDGE ALERT</button>`;
 $("#modal").classList.add("show"); play("critical");
 $$("#modalContent [data-record-table]").forEach(el=>el.onclick=()=>openRecord(el.dataset.recordTable,el.dataset.id));
 $("#ackSubjectAlert").onclick=()=>{$("#modal").classList.remove("show");log("ALERT ACKNOWLEDGED","Subject Alerts",matches[0]?.row?.record_no||"",name)};
}
async function checkAndBroadcastSubjectAlerts(subject,source){
 const matches=collectSubjectMatches(subject); if(!matches.length)return matches;
 showSubjectAlert(subject,matches,source);
 const name=personName(subject)||"UNKNOWN SUBJECT";
 if(db)await db.from("notifications").insert({department:activeDepartment,title:`SUBJECT ALERT — ${name}`,message:`${matches.length} alert match(es) during ${source}: ${matches.map(m=>m.reason).join(" | ")}`,type:"CRITICAL",created_by:profile?.name||"SYSTEM"});
 return matches;
}

function watchMatch(e){return state.watch_list.find(w=>w.status==="ACTIVE"&&((w.name&&e.name&&w.name.toLowerCase()===e.name.toLowerCase())||(w.plate&&e.plate&&w.plate.toLowerCase()===e.plate.toLowerCase())||(w.badge&&e.badge&&w.badge.toLowerCase()===e.badge.toLowerCase())))}
function activeEntries(){return deptRows("port_entries").filter(x=>!x.time_out&&!["DRAFT","DENIED","CANCELLED","EXITED"].includes(norm(x.status)))}
function renderOccupancy(){
 let rows=activeEntries();$("#occupancyRows").innerHTML=rows.map(e=>{let m=elapsed(e.time_in),pending=norm(e.status)==="PENDING",cl=pending?"amber":m>=10?"red":m>=5?"amber":"green",st=pending?"AT GATE / PENDING":m>=10?"OVERDUE 10+":m>=5?"OVERDUE 5+":"STILL INSIDE",w=watchMatch(e);
 return `<tr class="occupancy-clickable" data-id="${e.id}"><td>${esc(e.record_no)}</td><td>${esc(e.name)}</td><td>${esc(e.company)}</td><td>${esc(e.plate)}</td><td>${fmt(e.time_in)}</td><td>${m} MIN</td><td><span class="tag ${cl}">${st}</span></td><td>${w?'<span class="tag red">MATCH</span>':'<span class="tag green">CLEAR</span>'}</td></tr>`}).join("")||'<tr><td colspan="8">No active occupants.</td></tr>';
 $("#exitRecord").innerHTML='<option value="">Select...</option>'+rows.map(e=>`<option value="${e.id}">${e.record_no} — ${e.name} — ${e.plate||"NO PLATE"}</option>`).join("");
 $$("#occupancyRows .occupancy-clickable").forEach(x=>x.onclick=()=>openRecord("port_entries",x.dataset.id));
}
$("#mediaForm").onsubmit=async e=>{e.preventDefault();if(!db)return toast("Database connection is unavailable. Refresh the page.");let f=new FormData(e.target),file=$("#mediaFile").files[0],url=f.get("external_url")||"";
 if(file){let path=`${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`,up=await db.storage.from("bodycam").upload(path,file);if(up.error)return toast(up.error.message);url=db.storage.from("bodycam").getPublicUrl(path).data.publicUrl}
 let o={record_no:recordNo("MED"),related_record:f.get("related_record"),media_type:f.get("media_type"),title:f.get("title"),officer:f.get("officer")||profile.name,recorded_at:f.get("recorded_at")||new Date().toISOString(),status:f.get("status"),media_url:url,description:f.get("description"),created_by:profile.name,department:activeDepartment};
 let {error}=await db.from("media_records").insert(o);if(error)return toast(error.message);play("scan");log("MEDIA LINKED","Bodycam & Media",o.record_no,o.related_record);e.target.reset();toast(`${o.record_no} linked`)};
function renderMedia(){
 $("#mediaRecords").innerHTML='<div class="record-list">'+state.media_records.map(r=>`<div class="record media-item" data-id="${r.id}"><div class="record-head"><b>${esc(r.record_no)} · ${esc(r.media_type)}</b><span class="tag blue">${esc(r.status)}</span></div><p>${esc(r.title)} · Linked to ${esc(r.related_record)}</p></div>`).join("")+'</div>';
 $$(".media-item").forEach(x=>x.onclick=()=>{let r=state.media_records.find(y=>y.id===x.dataset.id),u=r.media_url||"";$("#mediaPreview").innerHTML=!u?'<div>No file or link attached.</div>':r.media_type.match(/PHOTO|SCREENSHOT/)?`<img src="${esc(u)}">`:r.media_type==="AUDIO"?`<audio controls src="${esc(u)}"></audio>`:`<video controls src="${esc(u)}"></video><p><a href="${esc(u)}" target="_blank">Open media in new tab</a></p>`});
}
$("#globalSearch").oninput=renderSearch;
function renderSearch(){let q=$("#globalSearch").value.toLowerCase().trim();if(!q)return $("#searchResults").innerHTML="";let out=[];TABLES.filter(t=>t!=="activity_log").forEach(t=>state[t].forEach(r=>{if(JSON.stringify(r).toLowerCase().includes(q))out.push({...r,_table:t})}));$("#searchResults").innerHTML='<div class="record-list">'+out.slice(0,100).map(r=>`<div class="record" data-record-table="${esc(r._table)}" data-id="${esc(r.id)}"><b>${esc(r.record_no||r._table)}</b><p>${esc(r._table.replaceAll("_"," ").toUpperCase())} · ${esc(r.name||r.full_name||r.person_name||r.title||r.plate||r.description||"Match")}</p></div>`).join("")+'</div>';$$("#searchResults [data-record-table]").forEach(x=>x.onclick=()=>openRecord(x.dataset.recordTable,x.dataset.id))}
function renderActivity(){let html=state.activity_log.slice(0,100).map(a=>`<div class="timeline-item"><b>${esc(a.officer)} ${esc(a.unit||"")}</b> ${esc(a.action)} <b>${esc(a.record_no||"")}</b><br><small>${esc(a.module)} · ${fmt(a.created_at)} ${a.details?"· "+esc(a.details):""}</small></div>`).join("");$("#activityRows").innerHTML=html||'<div class="empty">No activity.</div>';$("#recentActivity").innerHTML=state.activity_log.slice(0,8).map(a=>`<div class="timeline-item"><b>${esc(a.officer)}</b> ${esc(a.action)} ${esc(a.record_no||"")}<br><small>${fmt(a.created_at)}</small></div>`).join("")}
function alertOnce(key,type){if(alertMemory.has(key))return;alertMemory.add(key);localStorage.setItem("fcps_alerts",JSON.stringify([...alertMemory].slice(-300)));play(type)}
function renderDashboard(){
 let active=activeEntries(),m5=active.filter(e=>elapsed(e.time_in)>=5&&elapsed(e.time_in)<10),m10=active.filter(e=>elapsed(e.time_in)>=10),wm=active.filter(watchMatch);
 $("#kCad").textContent=deptRows("cad_calls").filter(x=>x.status!=="CLOSED").length;$("#kInc").textContent=deptRows("incidents").filter(x=>x.status!=="CLOSED").length;$("#kInside").textContent=active.length;$("#k5").textContent=m5.length;$("#k10").textContent=m10.length;$("#kWatch").textContent=wm.length;let a=deptRows("arrests"),c=deptRows("citations");$("#kArrests").textContent=a.length;$("#kFelony").textContent=a.filter(x=>norm(x.classification).includes("FELONY")).length;$("#kMisdemeanor").textContent=a.filter(x=>norm(x.classification).includes("MISDEMEANOR")).length;$("#kCitations").textContent=c.filter(x=>x.action==="CITATION").length;$("#kWritten").textContent=c.filter(x=>x.action==="WRITTEN WARNING").length;$("#kVerbal").textContent=c.filter(x=>x.action==="VERBAL WARNING").length;
 let alerts=[...wm.map(x=>({t:`WATCH LIST MATCH — ${x.name}`,s:x.record_no,c:"danger"})),...m10.map(x=>({t:`${x.name} overdue ${elapsed(x.time_in)} minutes`,s:x.record_no,c:"danger"})),...deptRows("cad_calls").filter(x=>x.priority==="EMERGENCY"&&x.status!=="CLOSED").map(x=>({t:`EMERGENCY CAD — ${x.call_type}`,s:x.record_no,c:"danger"}))];
 $("#alerts").innerHTML=alerts.map(a=>`<div class="card ${a.c}"><strong>${esc(a.t)}</strong><small>${esc(a.s)}</small></div>`).join("")||"No priority alerts.";
 wm.forEach(x=>alertOnce("watch-"+x.id,"critical"));m5.forEach(x=>alertOnce("5-"+x.id,"warning"));m10.forEach(x=>alertOnce("10-"+x.id,"critical"));
}
function renderStatistics(){
 const a=deptRows("arrests"),c=deptRows("citations"),inc=deptRows("incidents"),cad=deptRows("cad_calls");
 const vals={"Total Arrests":a.length,"Felony Arrests":a.filter(x=>norm(x.classification).includes("FELONY")).length,"Misdemeanor Arrests":a.filter(x=>norm(x.classification).includes("MISDEMEANOR")).length,"Citations":c.filter(x=>x.action==="CITATION").length,"Written Warnings":c.filter(x=>x.action==="WRITTEN WARNING").length,"Verbal Warnings":c.filter(x=>x.action==="VERBAL WARNING").length,"Incidents":inc.length,"CAD Calls":cad.length,"Active Warrants":deptRows("warrants").filter(x=>x.status==="ACTIVE").length,"Active BOLOs":deptRows("bolos").filter(x=>x.status==="ACTIVE").length};
 $("#statsDeptLabel").textContent="ALL DEPARTMENTS · REGIONAL TOTALS";$("#statisticsContent").innerHTML=`<div class="stats-grid">${Object.entries(vals).map(([k,v])=>`<div class="stat-tile"><span>${k}</span><strong>${v}</strong></div>`).join("")}</div>`;
}
function applyDepartment(){const d=DEPARTMENTS[activeDepartment];document.documentElement.style.setProperty("--dept",d.accent);$("#activeDepartmentName").textContent=d.name;$("#activeDepartmentCode").textContent=activeDepartment;$("#departmentSwitch").value=activeDepartment;document.body.classList.toggle("no-animations",!animationsEnabled);renderAll()}
function patrolStatusClass(status){return `status-${String(status||"OFF DUTY").toLowerCase().replaceAll(" ","-")}`}
function renderPatrolTools(){
 const statuses=["AVAILABLE","TRAFFIC STOP","ON SCENE","WRITING REPORT","HARBOR DETAIL","BUSY","EMERGENCY","OFF DUTY"];
 const current=state.patrol_status.find(x=>norm(x.officer_name)===norm(profile?.name)&&x.department===activeDepartment);
 $("#statusButtons").innerHTML=statuses.map(s=>`<button data-status="${s}" aria-pressed="${current?.status===s}" class="${patrolStatusClass(s)} ${current?.status===s?"active-status":""}">${s}</button>`).join("");
 $$('[data-status]').forEach(b=>b.onclick=()=>setPatrolStatus(b.dataset.status));
 if(current) $("#myStatusTimer").innerHTML=`<span class="status-indicator ${patrolStatusClass(current.status)}">${esc(current.status)}</span> · ${Math.max(0,Math.floor((Date.now()-new Date(current.status_since||current.updated_at).getTime())/60000))} min`;
 else $("#myStatusTimer").innerHTML='<span class="status-indicator status-off-duty">NOT SET</span>';
 syncEmergencyUI(current?.status === "EMERGENCY");
 const others=state.patrol_status.filter(x=>norm(x.officer_name)!==norm(profile?.name));
 $("#partnerAwareness").innerHTML=others.map(x=>`<div class="partner-card ${patrolStatusClass(x.status)}"><strong>${esc(x.officer_name)}</strong><span>${esc(x.unit_number||"")} · ${esc(x.department||"")}</span><b class="status-indicator ${patrolStatusClass(x.status)}">${esc(x.status)}</b><small>${esc(x.location||"No location set")} · ${Math.max(0,Math.floor((Date.now()-new Date(x.status_since||x.updated_at).getTime())/60000))} min</small></div>`).join("")||'<div class="empty">No partner status yet.</div>';
 $("#sharedNotes").innerHTML=state.shared_notes.slice(0,12).map(x=>`<div class="timeline-item"><b>${esc(x.officer_name)}</b> ${esc(x.note)}<br><small>${fmt(x.created_at)}</small></div>`).join("")||'<div class="empty">No shared notes.</div>';
 $("#officerMessages").innerHTML=state.officer_messages.slice(0,15).map(x=>`<div class="timeline-item"><b>${esc(x.officer_name)}</b> ${esc(x.message)}<br><small>${fmt(x.created_at)}</small></div>`).join("")||'<div class="empty">No messages.</div>';
 const reportTables=["incidents","arrests","citations","warrants","bolos"];
 const mine=reportTables.flatMap(t=>deptRows(t).map(r=>({...r,_table:t}))).filter(r=>norm(r.created_by)===norm(profile?.name));
 const draft=mine.filter(r=>["DRAFT","RETURNED FOR CORRECTION"].includes(norm(r.status))).length, pending=mine.filter(r=>["SUBMITTED","SUPERVISOR REVIEW"].includes(norm(r.status))).length;
 $("#reportWorkload").innerHTML=[["My Draft / Returned",draft],["Awaiting Review",pending],["My Total Reports",mine.length],["Active BOLOs",deptRows("bolos").filter(x=>x.status==="ACTIVE").length]].map(([k,v])=>`<div class="stat-tile"><span>${k}</span><strong>${v}</strong></div>`).join("");
 $("#recentReports").innerHTML=mine.slice(0,10).map(r=>`<div class="record"><b>${esc(r.record_no)}</b><p>${esc(r._table.toUpperCase())} · ${esc(r.status||r.action||"")}</p></div>`).join("")||'<div class="empty">No reports yet.</div>';
 const allCross=TABLES.filter(t=>!["activity_log","patrol_status","shared_notes","officer_messages","form_templates","notifications"].includes(t)).flatMap(t=>(state[t]||[]).map(r=>({...r,_table:t})));
 $("#intelSnapshot").innerHTML=`<div class="stats-grid"><div class="stat-tile"><span>Regional Records</span><strong>${allCross.length}</strong></div><div class="stat-tile"><span>Active Warrants</span><strong>${state.warrants.filter(x=>x.status==="ACTIVE").length}</strong></div><div class="stat-tile"><span>Active BOLOs</span><strong>${state.bolos.filter(x=>x.status==="ACTIVE").length}</strong></div><div class="stat-tile"><span>Known Vehicles</span><strong>${state.vehicles.length}</strong></div></div>`;
 $("#dashboardAnalytics").innerHTML=$("#statisticsContent").innerHTML||"";
}
async function setPatrolStatus(status){if(!db)return toast("Database unavailable");const existing=state.patrol_status.find(x=>norm(x.officer_name)===norm(profile.name)&&x.department===activeDepartment);const row={officer_name:profile.name,unit_number:profile.unit,department:activeDepartment,status,status_since:new Date().toISOString(),updated_at:new Date().toISOString()};let res=existing?await db.from("patrol_status").update(row).eq("id",existing.id):await db.from("patrol_status").insert(row);if(res.error)return toast(res.error.message);play(status==="EMERGENCY"?"critical":"acknowledge");load()}
function renderIntelligence(){let q=norm($("#intelSearch")?.value);if(!q){$("#intelResults").innerHTML='<div class="empty">Search to build a cross-department timeline.</div>';return}let matches=[];TABLES.filter(t=>!["activity_log","patrol_status","shared_notes","officer_messages","form_templates","notifications"].includes(t)).forEach(t=>(state[t]||[]).forEach(r=>{if(norm(JSON.stringify(r)).includes(q))matches.push({...r,_table:t})}));matches.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));$("#intelResults").innerHTML=`<div class="intel-summary"><strong>${matches.length} connected records</strong><span>Across ${new Set(matches.map(x=>x.department).filter(Boolean)).size} departments</span></div><div class="timeline">${matches.slice(0,100).map(r=>`<div class="timeline-item"><b>${esc(r.department||"REGIONAL")} · ${esc(r.record_no||r._table)}</b><br>${esc(r.full_name||r.person_name||r.arrestee||r.subject||r.name||r.plate||r.company_name||r.call_type||r.incident_type||"Connected record")}<br><small>${esc(r._table.replaceAll("_"," ").toUpperCase())} · ${fmt(r.created_at)}</small></div>`).join("")}</div>`}
function renderForms(){$("#savedForms").innerHTML='<div class="record-list">'+state.form_templates.filter(x=>x.department==="ALL"||x.department===activeDepartment).map(x=>`<div class="record"><b>${esc(x.form_name)}</b><p>${esc(x.department)} · ${(x.fields||[]).length} fields</p></div>`).join("")+'</div>'}
function renderAll(){Object.keys(configs).forEach(id=>{if($("#"+id).classList.contains("active"))renderModule(id)});renderOccupancy();renderMedia();renderActivity();renderDashboard();renderStatistics();renderSearch();renderPatrolTools();renderIntelligence();renderForms()}
async function load(){
 if(!db){$("#dbStatus").textContent="DATABASE LIBRARY NOT LOADED";$("#dbStatus").className="offline";renderAll();return;}
 let results=await Promise.all(TABLES.map(t=>db.from(t).select("*").order("created_at",{ascending:false}).limit(500)));
 const failures=results.map((r,i)=>r.error?{table:TABLES[i],error:r.error}:null).filter(Boolean);
 const bad=failures[0];
 $("#dbStatus").textContent=bad?`SETUP REQUIRED · ${bad.table.toUpperCase()}`:"DATABASE ONLINE";
 $("#dbStatus").className=bad?"offline":"online";
 $("#dbStatus").title=failures.map(x=>`${x.table}: ${x.error.message}`).join("\n");
 if(failures.length)console.error("Database schema/setup errors:",failures);
 results.forEach((r,i)=>state[TABLES[i]]=r.data||[]);renderAll();
}
let realtimeChannel=null;
let realtimeReady=false;
let realtimeRefreshTimer=null;
let realtimeReconnectTimer=null;
let presenceUsers={};
const realtimeClientId=(crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`);

function setRealtimeStatus(status,error=null){
 const el=$("#dbStatus");
 if(!el)return;
 if(status==="SUBSCRIBED"){
  realtimeReady=true;
  clearTimeout(realtimeReconnectTimer);
  el.textContent="DATABASE + REALTIME LIVE";
  el.className="online";
 }else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){
  realtimeReady=false;
  el.textContent="DATABASE ONLINE · REALTIME RECONNECTING";
  el.className="offline";
  if(error)console.error("Realtime channel error:",error);
  clearTimeout(realtimeReconnectTimer);
  realtimeReconnectTimer=setTimeout(startRealtime,2500);
 }else if(status==="CLOSED"){
  realtimeReady=false;
  el.textContent="DATABASE ONLINE · REALTIME OFFLINE";
  el.className="offline";
  clearTimeout(realtimeReconnectTimer);
  if(navigator.onLine)realtimeReconnectTimer=setTimeout(startRealtime,2500);
 }
}
function recordActor(row={}){return row.created_by||row.officer_name||row.officer||"Another user"}
function describeRealtimeChange(table,row,eventType){
 const label=String(table||"record").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
 const number=row?.record_no||row?.badge_number||row?.title||"";
 return `${recordActor(row)} ${eventType==="INSERT"?"added":eventType==="UPDATE"?"updated":"removed"} ${label}${number?` ${number}`:""}`;
}
function applyRealtimePayload(payload){
 const table=payload.table;
 if(!TABLES.includes(table))return;
 const eventType=payload.eventType;
 const row=eventType==="DELETE"?payload.old:payload.new;
 if(!row)return;
 const rows=state[table]||[];
 if(eventType==="INSERT"){
  const i=rows.findIndex(x=>x.id===row.id);
  if(i>=0)rows[i]=row;else rows.unshift(row);
 }else if(eventType==="UPDATE"){
  const i=rows.findIndex(x=>x.id===row.id);
  if(i>=0)rows[i]={...rows[i],...row};else rows.unshift(row);
 }else if(eventType==="DELETE"){
  state[table]=rows.filter(x=>x.id!==row.id);
 }
 clearTimeout(realtimeRefreshTimer);
 realtimeRefreshTimer=setTimeout(renderAll,35);
 const actor=norm(recordActor(row));
 const me=norm(profile?.name||"");
 if(actor&&actor!==me){
  toast(describeRealtimeChange(table,row,eventType));
  if(table==="notifications"&&eventType==="INSERT"){play(norm(row.type)==="CRITICAL"?"critical":"notification");if(norm(row.type)==="CRITICAL"&&norm(row.title).includes("SUBJECT ALERT")){showSubjectAlert({first_name:row.title.replace(/.*—\s*/,"")},[{table:"notifications",row,reason:row.message||row.title,severity:"CRITICAL"}],"REMOTE MATCH")}}
  else if(table==="patrol_status"&&eventType!=="DELETE"&&norm(row.status)==="EMERGENCY")play("critical");
  else if(["officer_messages","shared_notes","bolos","cad_calls"].includes(table)&&eventType==="INSERT")play("notification");
 }
}
function renderPresence(){
 const el=$("#liveUsers");
 if(!el)return;
 const users=Object.values(presenceUsers).flat().filter(Boolean);
 const unique=[...new Map(users.map(u=>[u.client_id,u])).values()];
 el.textContent=`${unique.length} ACTIVE USER${unique.length===1?"":"S"}`;
 el.title=unique.map(u=>`${u.name||"Officer"} · ${u.unit||""} · ${u.department||""}`).join("\n")||"No active users detected";
}
async function trackPresence(){
 if(!realtimeChannel||!profile)return;
 await realtimeChannel.track({client_id:realtimeClientId,name:profile.name,unit:profile.unit,department:activeDepartment,status:"ONLINE",online_at:new Date().toISOString()});
}
function startRealtime(){
 if(!db)return;
 clearTimeout(realtimeReconnectTimer);
 if(realtimeChannel)db.removeChannel(realtimeChannel);
 realtimeChannel=db.channel("fpss-live-all",{config:{broadcast:{self:false},presence:{key:realtimeClientId}}});
 TABLES.forEach(table=>{
  realtimeChannel.on("postgres_changes",{event:"*",schema:"public",table},applyRealtimePayload);
 });
 realtimeChannel
  .on("presence",{event:"sync"},()=>{presenceUsers=realtimeChannel.presenceState();renderPresence()})
  .on("presence",{event:"join"},()=>{presenceUsers=realtimeChannel.presenceState();renderPresence()})
  .on("presence",{event:"leave"},()=>{presenceUsers=realtimeChannel.presenceState();renderPresence()})
  .subscribe(async(status,error)=>{setRealtimeStatus(status,error);if(status==="SUBSCRIBED")await trackPresence()});
}
if(db)startRealtime();
window.addEventListener("online",()=>{load();startRealtime()});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&db&&!realtimeReady)startRealtime()});
$("#quickActions").innerHTML=[["Traffic Stop","citations"],["New Incident","incidents"],["New Arrest","arrests"],["Citation / Warning","citations"],["Gate Entry","gate"],["Quick BOLO","bolos"],["Search Everything","search"],["Bodycam","media"]].map(([a,b])=>`<button data-go="${b}">${a}</button>`).join("");$$("[data-go]").forEach(b=>b.onclick=()=>showPage(b.dataset.go));
$("#soundToggle").onclick=()=>{$("#masterSound").checked=!sound.enabled;$("#masterSound").dispatchEvent(new Event("change"))};$("#masterSound").onchange=e=>{sound.enabled=e.target.checked;localStorage.setItem("fcps_sound",sound.enabled);$("#soundToggle").textContent=sound.enabled?"SOUND ON":"SOUND OFF"};$("#soundVolume").oninput=e=>{sound.volume=+e.target.value;localStorage.setItem("fcps_volume",sound.volume)};$$("[data-sound]").forEach(b=>b.onclick=()=>play(b.dataset.sound));
$("#departmentSwitch").onchange=e=>{activeDepartment=e.target.value;localStorage.setItem("fcps_department",activeDepartment);applyDepartment();trackPresence();play("scan")};
function updateProfile(){if(!profile){$("#loginOverlay").classList.remove("hidden");return}$("#loginOverlay").classList.add("hidden");$("#userBadge").textContent=`${profile.unit} · ${profile.name}`;activeDepartment=profile.department||activeDepartment;$("#profileDisplay").innerHTML=`<h3>${esc(profile.name)}</h3><p>${esc(profile.unit)} · ${esc(profile.role)} · ${esc(activeDepartment)}</p>`;applyDepartment()}
$("#enterSystem").onclick=()=>{profile={name:$("#profileName").value.trim()||"Officer",unit:$("#profileUnit").value.trim()||"FCP-000",department:$("#profileDepartment").value,role:$("#profileRole").value};activeDepartment=profile.department;localStorage.setItem("fcps_profile",JSON.stringify(profile));updateProfile();trackPresence();play("success")};$("#changeProfile").onclick=()=>{$("#loginOverlay").classList.remove("hidden")};
$("#soundPack").value=sound.pack;$("#soundPack").onchange=e=>{sound.pack=e.target.value;localStorage.setItem("fcps_sound_pack",sound.pack);play("dispatch")};$("#animationsEnabled").checked=animationsEnabled;$("#animationsEnabled").onchange=e=>{animationsEnabled=e.target.checked;localStorage.setItem("fcps_animations",animationsEnabled);document.body.classList.toggle("no-animations",!animationsEnabled)};$("#masterSound").checked=sound.enabled;$("#soundVolume").value=sound.volume;$("#soundToggle").textContent=sound.enabled?"SOUND ON":"SOUND OFF";
function renderDropdownManager(){
 const keys=Object.keys(DEFAULT_CHOICES).sort();$("#dropdownField").innerHTML=keys.map(k=>`<option value="${k}">${k.replaceAll("_"," ").toUpperCase()}</option>`).join("");renderDropdownChoices();
}
function renderDropdownChoices(){const k=$("#dropdownField").value;if(!k)return;$("#dropdownChoices").innerHTML=choicesFor(k).map(v=>`<span class="choice-chip">${esc(v)}${(JSON.parse(localStorage.getItem(customChoiceKey(k))||"[]").includes(v))?`<button data-remove-choice="${esc(v)}">×</button>`:""}</span>`).join("");$$('[data-remove-choice]').forEach(b=>b.onclick=()=>{let a=JSON.parse(localStorage.getItem(customChoiceKey(k))||"[]").filter(x=>x!==b.dataset.removeChoice);localStorage.setItem(customChoiceKey(k),JSON.stringify(a));renderDropdownChoices()})}
$("#dropdownField").onchange=renderDropdownChoices;$("#addDropdownChoice").onclick=()=>{const k=$("#dropdownField").value,v=$("#dropdownChoice").value.trim();if(!v)return;rememberChoice(k,v);$("#dropdownChoice").value="";renderDropdownChoices();toast("Dropdown choice added")};renderDropdownManager();
setInterval(()=>{$("#clock").textContent=new Date().toLocaleString();renderOccupancy();renderDashboard()},1000);updateProfile();load();

$$('.nav-group-toggle').forEach(b=>b.onclick=()=>b.parentElement.classList.toggle('open'));
$$('.dash-tab').forEach(b=>b.onclick=()=>{$$('.dash-tab').forEach(x=>x.classList.remove('active'));$$('.dash-section').forEach(x=>x.classList.remove('active'));b.classList.add('active');$(`[data-dash-section="${b.dataset.dash}"]`).classList.add('active')});
$('#intelSearch').oninput=renderIntelligence;
$('#sharedNoteForm').onsubmit=async e=>{e.preventDefault();if(!db)return toast('Database unavailable');const note=new FormData(e.target).get('note').trim();if(!note)return;const {error}=await db.from('shared_notes').insert({officer_name:profile.name,unit_number:profile.unit,department:activeDepartment,note});if(error)return toast(error.message);e.target.reset();play('success');load()};
$('#messageForm').onsubmit=async e=>{e.preventDefault();if(!db)return toast('Database unavailable');const message=new FormData(e.target).get('message').trim();if(!message)return;const {error}=await db.from('officer_messages').insert({officer_name:profile.name,unit_number:profile.unit,department:activeDepartment,message});if(error)return toast(error.message);e.target.reset();play('scan');load()};
$('#formBuilder').onsubmit=async e=>{e.preventDefault();if(!db)return toast('Database unavailable');const f=new FormData(e.target),fields=String(f.get('fields')).split(/\n+/).map(x=>x.trim()).filter(Boolean).map(x=>{const [label,type='text']=x.split('|');return {label:label.trim(),type:type.trim()}});const {error}=await db.from('form_templates').insert({form_name:f.get('name'),department:f.get('department'),fields,created_by:profile.name});if(error)return toast(error.message);e.target.reset();play('success');load()};


function renderAddressIntelligence(){
 const el=$("#addressResults"); if(!el)return; const q=norm($("#addressSearch")?.value); if(!q){el.innerHTML='<div class="empty">Enter an address or location.</div>';return}
 const found=[]; TABLES.filter(t=>!["activity_log","notifications"].includes(t)).forEach(t=>(state[t]||[]).forEach(r=>{const text=norm([r.address,r.location,r.destination,r.impound_lot,r.court_name].filter(Boolean).join(" "));if(text.includes(q))found.push({...r,_table:t})}));
 el.innerHTML=`<div class="intel-summary"><strong>${found.length} connected records</strong><span>${new Set(found.map(x=>x.department).filter(Boolean)).size} departments</span></div><div class="timeline">${found.map(r=>`<div class="timeline-item"><b>${esc(r.record_no||r._table)}</b> · ${esc(r.department||"REGIONAL")}<br>${esc(r.full_name||r.person_name||r.driver_name||r.subject_name||r.plate||r.call_type||r.incident_type||"Record")}<br><small>${esc(r._table.replaceAll("_"," ").toUpperCase())} · ${fmt(r.created_at)}</small></div>`).join("")||'<div class="empty">No connected records.</div>'}</div>`;
}
function renderCaseBoard(){
 const el=$("#caseBoardResults");if(!el)return;const q=norm($("#caseBoardSearch")?.value);if(!q){el.innerHTML='<div class="empty">Search a case, person, plate, or company.</div>';return}
 const found=[];TABLES.filter(t=>!["activity_log","patrol_status","shared_notes","officer_messages","form_templates","notifications"].includes(t)).forEach(t=>(state[t]||[]).forEach(r=>{if(norm(JSON.stringify(r)).includes(q))found.push({...r,_table:t})}));
 const groups={PEOPLE:[],VEHICLES:[],REPORTS:[],EVIDENCE:[],PORT:[],MEDIA:[],OTHER:[]};found.forEach(r=>{let g=r._table==="people"?"PEOPLE":r._table==="vehicles"?"VEHICLES":r._table==="evidence"?"EVIDENCE":r._table==="media_records"?"MEDIA":r._table.includes("port")||r._table.includes("visitor")||r._table==="access_list"?"PORT":["incidents","arrests","citations","warrants","bolos","cad_calls","traffic_stops","field_interviews","vehicle_searches","tow_records","court_events"].includes(r._table)?"REPORTS":"OTHER";groups[g].push(r)});
 el.innerHTML=`<div class="case-node central"><strong>${esc($("#caseBoardSearch").value)}</strong><span>${found.length} connections</span></div><div class="case-columns">${Object.entries(groups).filter(([,v])=>v.length).map(([g,v])=>`<div class="case-group"><h4>${g} (${v.length})</h4>${v.slice(0,12).map(r=>`<div class="case-node"><b>${esc(r.record_no||r._table)}</b><span>${esc(r.full_name||r.person_name||r.driver_name||r.plate||r.subject||r.title||r.company_name||r.incident_type||r.call_type||"Connected record")}</span></div>`).join("")}</div>`).join("")}</div>`;
}
function renderNotifications(){const el=$("#notificationRows");if(!el)return;const rows=deptRows("notifications");el.innerHTML=rows.map(n=>`<div class="timeline-item ${n.is_read?'':'unread'}"><b>${esc(n.title)}</b><br>${esc(n.message||'')}<br><small>${fmt(n.created_at)}</small></div>`).join("")||'<div class="empty">No notifications.</div>'}
async function notify(title,message,type="INFO"){if(!db)return;await db.from("notifications").insert({department:activeDepartment,title,message,type,created_by:profile?.name||"SYSTEM"})}
function assistantAnswer(question){
 const q=norm(question), all=TABLES.flatMap(t=>(state[t]||[]).map(r=>({...r,_table:t})));
 if(q.includes("ACTIVE WARRANT")){const r=state.warrants.filter(x=>x.status==="ACTIVE");return `<h3>${r.length} Active Warrants</h3>${r.map(x=>`<p><b>${esc(x.record_no)}</b> — ${esc(x.person_name)} · ${esc(x.charges)}</p>`).join("")||'<p>None found.</p>'}`}
 if(q.includes("ACTIVE BOLO")){const r=state.bolos.filter(x=>x.status==="ACTIVE");return `<h3>${r.length} Active BOLOs</h3>${r.map(x=>`<p><b>${esc(x.record_no)}</b> — ${esc(x.subject)} ${esc(x.plate||'')}</p>`).join("")||'<p>None found.</p>'}`}
 if(q.includes("INSIDE")||q.includes("NEVER EXIT")){const r=activeEntries();return `<h3>${r.length} Currently Inside</h3>${r.map(x=>`<p><b>${esc(x.name)}</b> — ${esc(x.company||'')} · ${esc(x.plate||'NO PLATE')}</p>`).join("")||'<p>No active entries.</p>'}`}
 const rec=(question.match(/[A-Z]{2,10}-[A-Z]*-?\d{3,}/i)||[])[0];if(rec){const r=all.find(x=>norm(x.record_no)===norm(rec));if(!r)return `<p>No record found for <b>${esc(rec)}</b>.</p>`;const related=all.filter(x=>norm(JSON.stringify(x)).includes(norm(rec)));return `<h3>${esc(r.record_no)} Summary</h3><p>${esc(r.narrative||r.notes||r.description||r.details||r.reason||'Record located.')}</p><p><b>${related.length}</b> directly linked records were found.</p>`}
 if(q.includes("DRAFT")&&q.includes("NARRATIVE"))return `<h3>Narrative Draft</h3><p>On ${new Date().toLocaleDateString()}, I was conducting patrol duties within ${esc(DEPARTMENTS[activeDepartment].name)} when I observed a vehicle and initiated a lawful traffic stop. I contacted the driver, explained the reason for the stop, verified the driver and vehicle information, and completed the appropriate enforcement action. All actions and relevant observations were documented in the associated records.</p><small>Review and replace the general language with the exact facts before submitting.</small>`;
 const words=q.split(/\s+/).filter(x=>x.length>2), found=all.filter(r=>words.every(w=>norm(JSON.stringify(r)).includes(w))).slice(0,30);return `<h3>${found.length} Matches</h3>${found.map(r=>`<p><b>${esc(r.record_no||r._table)}</b> — ${esc(r.full_name||r.person_name||r.driver_name||r.subject||r.plate||r.company_name||r.title||r.incident_type||r.call_type||'Record')} <small>${esc(r._table)}</small></p>`).join("")||'<p>No matching records. Try fewer or more specific words.</p>'}`;
}
function renderNewFeatures(){renderAddressIntelligence();renderCaseBoard();renderNotifications()}
const oldRenderAll=renderAll;renderAll=function(){oldRenderAll();renderNewFeatures()};
$("#addressSearch").oninput=renderAddressIntelligence;$("#caseBoardSearch").oninput=renderCaseBoard;
$("#assistantForm").onsubmit=e=>{e.preventDefault();const q=new FormData(e.target).get("question");$("#assistantResponse").classList.remove("empty");$("#assistantResponse").innerHTML=assistantAnswer(q)};
$("#markNotificationsRead").onclick=async()=>{if(!db)return;await db.from("notifications").update({is_read:true}).eq("department",activeDepartment);load()};
function syncEmergencyUI(isActive){
 const button=$("#emergencyButton");
 if(!button)return;
 document.body.classList.toggle("emergency-mode",!!isActive);
 button.classList.toggle("active",!!isActive);
 button.textContent=isActive?"CLEAR EMERGENCY":"EMERGENCY";
 button.setAttribute("aria-pressed",isActive?"true":"false");
}
$("#emergencyButton").onclick=async()=>{
 const current=state.patrol_status.find(x=>norm(x.officer_name)===norm(profile?.name)&&x.department===activeDepartment);
 const isActive=current?.status==="EMERGENCY"||document.body.classList.contains("emergency-mode");
 if(isActive){
  if(!confirm("Clear emergency mode and notify your partner that you are safe?"))return;
  const prior=localStorage.getItem("fcps_pre_emergency_status")||"AVAILABLE";
  syncEmergencyUI(false);
  await setPatrolStatus(prior==="EMERGENCY"?"AVAILABLE":prior);
  localStorage.removeItem("fcps_pre_emergency_status");
  await notify("EMERGENCY CLEARED",`${profile.name} (${profile.unit}) cleared emergency mode.`,"INFO");
  play("acknowledge");
  toast("Emergency mode cleared.");
  return;
 }
 if(!confirm("Activate emergency mode and alert your partner?"))return;
 localStorage.setItem("fcps_pre_emergency_status",current?.status&&current.status!=="EMERGENCY"?current.status:"AVAILABLE");
 syncEmergencyUI(true);
 await setPatrolStatus("EMERGENCY");
 await notify("OFFICER EMERGENCY",`${profile.name} (${profile.unit}) activated emergency mode.`,"CRITICAL");
 play("critical");
 toast("Emergency alert sent. Click CLEAR EMERGENCY when safe.");
};

const RECORD_TABLE_LABELS={cad_calls:"CAD Calls",incidents:"Incidents",arrests:"Arrests",citations:"Citations & Warnings",warrants:"Warrants",bolos:"BOLOs",port_entries:"Port Entries",port_records:"Port Records",people:"People",vehicles:"Vehicles",evidence:"Evidence",media_records:"Media Records",companies:"Companies",shifts:"Shifts",watch_list:"Watch List",patrol_status:"Patrol Status",shared_notes:"Shared Notes",officer_messages:"Officer Messages",form_templates:"Form Templates",traffic_stops:"Traffic Stops",field_interviews:"Field Interviews",vehicle_searches:"Vehicle Searches",tow_records:"Tow Records",visitor_passes:"Visitor Passes",access_list:"Access List",court_events:"Court Events",equipment_checkout:"Equipment Checkout",notifications:"Notifications",subject_alerts:"Subject Alerts",activity_log:"Activity Log"};
function initRecordManagement(){
 const select=$("#clearTable"),confirmInput=$("#clearConfirmation"),button=$("#clearSelectedRecords");if(!select||!button)return;
 select.innerHTML=TABLES.map(t=>`<option value="${t}">${RECORD_TABLE_LABELS[t]||t}</option>`).join("");
 const validate=()=>button.disabled=confirmInput.value!=="DELETE";confirmInput.addEventListener("input",validate);
 button.onclick=async()=>{
  if(confirmInput.value!=="DELETE")return;const table=select.value,scope=$("#clearScope").value,label=RECORD_TABLE_LABELS[table]||table;
  const scopeText=scope==="all"?"ALL DEPARTMENTS":DEPARTMENTS[activeDepartment]?.name||activeDepartment;
  if(!confirm(`Permanently clear ${label} for ${scopeText}? This affects every user and cannot be undone.`))return;
  const final=prompt(`Final confirmation: type CLEAR ${label.toUpperCase()}`);if(final!==`CLEAR ${label.toUpperCase()}`)return toast("Clear operation cancelled.");
  let query=db.from(table).delete();if(scope==="department")query=query.eq("department",activeDepartment);else query=query.not("id","is",null);
  const {error}=await query;if(error)return toast(error.message);
  if(table!=="activity_log")await db.from("activity_log").insert({officer:profile?.name||"UNKNOWN",unit:profile?.unit||"",department:activeDepartment,action:"BULK CLEAR",module:table,record_no:"",details:`Cleared ${label}; scope ${scopeText}`});
  confirmInput.value="";validate();play("close");toast(`${label} cleared`);
 };
}
initRecordManagement();
