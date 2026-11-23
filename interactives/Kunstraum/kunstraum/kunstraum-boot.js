window.addEventListener('load',()=>{
 window.openArtStudio?.();
 const originalClose=window.closeArtStudio;
 const leave=()=>{if(parent!==window)parent.postMessage({type:'kunstraum-module-close'},location.origin);else{originalClose();document.getElementById('standaloneReturn').hidden=false;}};
 window.closeArtStudio=leave;
 document.getElementById('artClose').onclick=leave;
 const back=document.createElement('button');back.id='standaloneReturn';back.hidden=true;back.textContent='Kunstatelier wieder öffnen';back.onclick=()=>{back.hidden=true;window.openArtStudio();};document.body.appendChild(back);
});

