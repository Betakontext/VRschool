from pathlib import Path
import contextlib,http.server,socketserver,threading,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).parent
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
@contextlib.contextmanager
def server():
 old=os.getcwd();os.chdir(ROOT);s=socketserver.TCPServer(('127.0.0.1',0),Quiet);threading.Thread(target=s.serve_forever,daemon=True).start()
 try: yield f'http://127.0.0.1:{s.server_address[1]}/integrationstest.html'
 finally:s.shutdown();s.server_close();os.chdir(old)
def main():
 errors=[]
 with server() as url,sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']);p=b.new_page(viewport={'width':1280,'height':850});p.on('pageerror',lambda e:errors.append(str(e)));p.goto(url);p.evaluate('openPausenhofModule()');g=p.frame_locator('#pausenhofDialog iframe');g.locator('[data-g="1"]').click();g.locator('#go').click();c=g.locator('canvas');box=c.bounding_box();assert box
  def kick(x,y):
   q=c.bounding_box();assert q
   p.mouse.move(q['x']+q['width']*x/900,q['y']+q['height']*y/500);p.mouse.down();p.wait_for_timeout(480);p.mouse.up()
  kick(205,110);p.wait_for_timeout(1700);msg=g.locator('#msg').inner_text();stat=g.locator('#stat').inner_text();assert 'TOR!' in msg and '100' in stat,(msg,stat)
  p.wait_for_timeout(500);kick(450,210);p.wait_for_timeout(2200);msg2=g.locator('#msg').inner_text();assert 'GEHALTEN' in msg2,msg2
  src=(ROOT/'pausenhof/pausenhof.js').read_text()
  for n in ('function penInit','function penAct','function penUpdate','function penDraw'):assert n in src,n
  b.close()
 assert not errors,errors
 print('PASS football iframe regression: corner target scored +100; central target triggered keeper dive/save; helper names present; no page errors.')
if __name__=='__main__':main()
