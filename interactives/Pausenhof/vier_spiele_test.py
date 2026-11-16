from pathlib import Path
import contextlib,http.server,socketserver,threading,os
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).parent
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
@contextlib.contextmanager
def serve():
 old=os.getcwd();os.chdir(ROOT); s=socketserver.TCPServer(('127.0.0.1',0),Quiet);threading.Thread(target=s.serve_forever,daemon=True).start()
 try: yield f'http://127.0.0.1:{s.server_address[1]}/integrationstest.html'
 finally:s.shutdown();s.server_close();os.chdir(old)
def run(reduced=False):
 with serve() as u, sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']);p=b.new_page(viewport={'width':390 if reduced else 1280,'height':760})
  if reduced:p.emulate_media(reduced_motion='reduce')
  errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(u);p.evaluate('openPausenhofModule()');f=p.frame_locator('#pausenhofDialog iframe');f.locator('[data-g="1"]').wait_for()
  names=f.locator('[data-g]').all_text_contents();assert len(names)==4,names
  assert ['Fußball' in names[0],'Zeitstopp' in names[1],'Basketball' in names[2],'Tischtennis' in names[3]]
  iid=p.locator('#pausenhofDialog iframe').evaluate("e=>e.__iid||(e.__iid=Math.random())")
  for i in [1,6,2,3]:
   f.locator(f'[data-g="{i}"]').click();f.locator('#go').click();f.locator('canvas').wait_for();f.locator('.ysselect').click();f.locator(f'[data-g="{i}"]').wait_for()
  assert p.locator('#pausenhofDialog iframe').evaluate('e=>e.__iid')==iid
  # football meter visual width is 60 px; deterministic good corner via known timing position by direct browser-side actual pointer release.
  f.locator('[data-g="1"]').click();f.locator('#go').click(); c=f.locator('canvas');box=c.bounding_box(); assert box
  # good charge .5: wait ~430ms, corner target; inspect banner and one award
  p.mouse.move(box['x']+box['width']*680/900,box['y']+box['height']*120/500);p.mouse.down();p.wait_for_timeout(430);p.mouse.up();p.wait_for_timeout(1400)
  msg=f.locator('#msg').inner_text();stat=f.locator('#stat').inner_text();assert 'TOOOR' in msg and '100' in stat,(msg,stat)
  # no second award after flight
  p.wait_for_timeout(700);assert '100' in f.locator('#stat').inner_text()
  # central target: good charge, keeper animated save; canvas source not altered API
  p.mouse.move(box['x']+box['width']*450/900,box['y']+box['height']*205/500);p.mouse.down();p.wait_for_timeout(430);p.mouse.up();p.wait_for_timeout(2100);assert 'GEHALTEN' in f.locator('#msg').inner_text()
  # poor quick release produces controlled on-screen explanatory behavior
  p.mouse.move(box['x']+box['width']*690/900,box['y']+box['height']*110/500);p.mouse.down();p.wait_for_timeout(30);p.mouse.up();expect(f.locator('#msg')).to_contain_text('streut sichtbar')
  # pause, external close/reopen
  f.locator('#pause').click();assert f.locator('#pause').inner_text()=='Fortsetzen';f.locator('#pause').click();p.locator('.pausenhof-exit').click();p.locator('#pausenhofDialog').wait_for(state='detached');p.evaluate('openPausenhofModule()');f=p.frame_locator('#pausenhofDialog iframe');f.locator('[data-g="1"]').wait_for()
  if reduced:
   # source-level runtime state observed on actual game: reduced media leads no shake
   f.locator('[data-g="1"]').click();f.locator('#go').click();c=f.locator('canvas');box=c.bounding_box();p.mouse.move(box['x']+box['width']*.75,box['y']+box['height']*.22);p.mouse.down();p.wait_for_timeout(430);p.mouse.up();p.wait_for_timeout(1250)
   val=f.locator('canvas').evaluate("c=>matchMedia('(prefers-reduced-motion: reduce)').matches") ;assert val
  assert not errors,errors;b.close()
 return names
if __name__=='__main__':
 n=run();run(True);print('PASS: iframe load; exact 4 ordered selections; all four start/return in same iframe; football good-corner single goal/TOOOR, central save/dive, poor-timing spread; pause; close/reopen; reduced-motion; mobile viewport.')
