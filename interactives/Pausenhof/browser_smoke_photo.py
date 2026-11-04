"""Local browser smoke. Opens via public window.openPausenhofModule(), not a host-specific button selector."""
from pathlib import Path
import contextlib, http.server, socketserver, threading
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).parent
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
@contextlib.contextmanager
def server():
    old=Path.cwd(); import os; os.chdir(ROOT)
    s=socketserver.TCPServer(('127.0.0.1',0),Quiet); t=threading.Thread(target=s.serve_forever,daemon=True);t.start()
    try: yield f'http://127.0.0.1:{s.server_address[1]}/integrationstest.html'
    finally: s.shutdown();s.server_close();os.chdir(old)
def main():
    errors=[]; checks=[]
    with server() as url, sync_playwright() as pw:
      browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
      page=browser.new_page(viewport={'width':1280,'height':850})
      page.on('pageerror',lambda e: errors.append('pageerror: '+str(e)))
      page.on('console',lambda m: errors.append('console '+m.type+': '+m.text) if m.type in ('error','assert') else None)
      page.goto(url,wait_until='networkidle'); page.evaluate('window.openPausenhofModule()')
      # Race-safe: child content must be visible through frame_locator before any interaction.
      game=page.frame_locator('#pausenhofDialog iframe')
      game.locator('[data-g="1"]').wait_for(state='visible',timeout=10000)
      iframe_id=page.locator('#pausenhofDialog iframe').evaluate("f=>f.__smokeId||(f.__smokeId=crypto.randomUUID())")
      # Confirm all packaged local photos decoded in the actual child document.
      bg=game.locator('body').evaluate("""async () => { const names=['pen','basket','pong','dodge','jump','stop','target','wall','balance','fit']; const rs=await Promise.all(names.map(n=>new Promise(ok=>{const i=new Image();i.onload=()=>ok([n,i.naturalWidth,i.naturalHeight]);i.onerror=()=>ok([n,0,0]);i.src='assets/backgrounds/'+n+'.webp';}))); return rs; }""")
      assert len(bg)==10 and all(w>0 and h>0 for _,w,h in bg),bg
      checks.append('10 local WebP backgrounds decoded with naturalWidth/naturalHeight > 0')
      for i in range(1,11):
        game.locator(f'[data-g="{i}"]').click()
        game.locator('#go').wait_for(state='visible'); game.locator('#go').click()
        canvas=game.locator('canvas'); canvas.wait_for(state='visible')
        # pointer events: press/release gives Basketball a genuine release; other games receive a click.
        box=canvas.bounding_box(); assert box and box['width']>0 and box['height']>0
        page.mouse.move(box['x']+box['width']*.52,box['y']+box['height']*.48)
        if i==2:
          page.mouse.down(); page.wait_for_timeout(120); page.mouse.up()
        else: page.mouse.click(box['x']+box['width']*.52,box['y']+box['height']*.48)
        # canvas has rendered pixels; visual effect/background rendering is not a blank canvas.
        nonblank=canvas.evaluate("""c=>{let d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=3;i<d.length;i+=4000)if(d[i])return true;return false}""")
        assert nonblank, f'blank canvas {i}'
        game.locator('.ysselect').click(); game.locator(f'[data-g="{i}"]').wait_for(state='visible')
      assert page.locator('#pausenhofDialog iframe').evaluate('(f)=>f.__smokeId') == iframe_id
      checks.append('all 10 games started, received pointer input, rendered nonblank canvas, and returned within same iframe')
      # Pause toggle and outer close/reopen.
      game.locator('[data-g="1"]').click();game.locator('#go').click();game.locator('#pause').click();game.locator('#pause').get_by_text('Fortsetzen').wait_for();game.locator('#pause').click()
      page.locator('.pausenhof-exit').click();page.locator('#pausenhofDialog').wait_for(state='detached')
      page.evaluate('window.openPausenhofModule()'); game=page.frame_locator('#pausenhofDialog iframe');game.locator('[data-g="1"]').wait_for(state='visible')
      checks.append('pause/resume and outer close/reopen passed')
      # Exact implementation invariants (not a rendered-opacity inference): photo then overlay alpha 0.5.
      src=(ROOT/'pausenhof/pausenhof.js').read_text()
      assert "theme(a.kind,c);c.save();c.globalAlpha=.5;photo(c,BG[a.kind]);c.restore()" in src
      checks.append('source confirms opaque theme first, then local photo at exact canvas globalAlpha=.5, then restored gameplay')
      browser.close()
    print('PASS: browser smoke complete')
    for x in checks: print('- '+x)
    print('console/page exceptions:', errors if errors else 'none')
    if errors: raise SystemExit(1)
if __name__=='__main__': main()
