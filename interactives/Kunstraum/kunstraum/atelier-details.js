// SPDX-FileCopyrightText: 2026 Christoph Medicus
// SPDX-License-Identifier: MIT

(() => {
 const studio=document.getElementById('artStudio'),water=document.getElementById('artWater');if(!studio||!water)return;
 const detail=document.createElement('div');detail.className='atelier-brush-state';detail.innerHTML='<div class="atelier-brush-model"><i class="brush-handle"></i><i class="brush-ferrule"></i><i class="brush-hair"></i></div><div><strong>Pinsel mit Farbe</strong><small>Bereit für deine Leinwand</small></div>';water.before(detail);
 const label=detail.querySelector('strong'),note=detail.querySelector('small');
 const setColor=color=>{studio.style.setProperty('--brush-pigment',color);label.textContent='Farbe aufgenommen';note.textContent='Pinsel bereit · '+color.toUpperCase();detail.classList.remove('clean','washing');};setColor('#e63d55');
 window.addEventListener('atelier:color',e=>setColor(e.detail));
 window.addEventListener('atelier:wash',e=>{water.style.setProperty('--rinse-color',e.detail);studio.classList.add('brush-washing');detail.classList.add('washing');label.textContent='Pinsel auswaschen';note.textContent='Alte Farbe löst sich im Wasser';});
 window.addEventListener('atelier:clean',()=>{studio.classList.remove('brush-washing');detail.classList.remove('washing');detail.classList.add('clean');studio.style.setProperty('--brush-pigment','#c4a978');label.textContent='Pinsel sauber';note.textContent='Wähle eine neue Farbe';});
 const lighting=document.createElement('div');lighting.className='atelier-light';lighting.setAttribute('aria-hidden','true');studio.prepend(lighting);
 const caption=document.createElement('div');caption.className='atelier-room-caption';caption.innerHTML='<span>QUINOA · KUNSTATELIER</span><b>Raum für deine Ideen.</b><small>KI-generierter Atelierhintergrund · interaktive Malfläche</small>';studio.appendChild(caption);
})();
