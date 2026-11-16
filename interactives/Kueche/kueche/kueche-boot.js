(function(){
'use strict';
window.showKitchenNotice=function(message){var box=document.getElementById('kitchenNotice');if(box){box.textContent=message;box.hidden=false;}};
window.addEventListener('error',function(event){if(!window.quinoaKitchenReady){window.showKitchenNotice('Die Küche konnte nicht vollständig starten. Bitte den gesamten Ordner interactives/Kueche austauschen und die Seite neu laden. Hinweis: '+(event.message||'Eine Spieldatei konnte nicht geladen werden.'));}},true);
window.addEventListener('load',function(){if(!window.quinoaKitchenReady)window.showKitchenNotice('Die Küche ist noch nicht gestartet. Prüfe, ob alle Dateien aus dem ZIP mitkopiert wurden. Die Gerichte stehen links; lade diese Seite danach neu.');});
})();
