/**
 * Module dependencies.
 */

var benchmark = require('benchmark')
var benchmarks = require('beautify-benchmark')

/**
 * Globals for benchmark.js
 */

global.cookie = require('..')

var suite = new benchmark.Suite()

suite.add({
  name: 'simple',
  minSamples: 100,
  fn: 'var val = cookie.parse("foo=bar")'
})

suite.add({
  name: 'decode',
  minSamples: 100,
  fn: 'var val = cookie.parse("foo=hello%20there!")'
})

suite.add({
  name: 'unquote',
  minSamples: 100,
  fn: 'var val = cookie.parse("foo=\\"foo bar\\"")'
})

suite.add({
  name: 'duplicates',
  minSamples: 100,
  fn: 'var val = cookie.parse(' + JSON.stringify(gencookies(2) + '; ' + gencookies(2)) + ')'
})

suite.add({
  name: '10 cookies',
  minSamples: 100,
  fn: 'var val = cookie.parse(' + JSON.stringify(gencookies(10)) + ')'
})

suite.add({
  name: '100 cookies',
  minSamples: 100,
  fn: 'var val = cookie.parse(' + JSON.stringify(gencookies(100)) + ')'
})

suite.add({
  name: 'google.com incognito',
  minSamples: 100,
  fn: 'var val = cookie.parse("NID=130=GdAPVGpnEPq2LKwy38x2d0AErvRNvuC3yfAtY2XiUT2B83ggMEFRn6S-PdxrPeuYHn5Y5uBEbqFVeLIRKce4EFKeDvh_91LlpE1NujZetagKM7afRhAYOH95Ump1jcFf; 1P_JAR=2018-5-12-20")'
})

suite.add({
  name: 'youtube.com incognito',
  minSamples: 100,
  fn: 'var val = cookie.parse("VISITOR_INFO1_LIVE=WH1B3k-faX8; YSC=aUulfohIT88; PREF=f4=4000000")'
})

suite.add({
  name: 'facebook.com incognito',
  minSamples: 100,
  fn: 'var val = cookie.parse("sb=Plf3WuruK82jBU1xVcf1DUmx; wd=1440x284; datr=Plf3WiK_c4K2RZj2zaHFmsyd; reg_fb_ref=https%3A%2F%2Fwww.facebook.com%2F; reg_fb_gate=https%3A%2F%2Fwww.facebook.com%2F; dpr=2; fr=0ove6zAgi2G1v5yDb..Ba91c-._K.AAA.0.0.Ba91dA.AWXjUzoM")'
})

suite.add({
  name: 'baidu.com incognito',
  minSamples: 100,
  fn: 'var val = cookie.parse("BAIDUID=1C050146E8E3C1E1D350EBFD12D51D96:FG=1; BIDUPSID=1C050146E8E3C1E1D350EBFD12D51D96; PSTM=1526158844; BD_HOME=0; H_PS_PSSID=1463_21090_18560_20928; BD_UPN=123253")'
})

suite.add({
  name: 'wikipedia.org incognito',
  minSamples: 100,
  fn: 'var val = cookie.parse("WMF-Last-Access-Global=12-May-2018; GeoIP=US:NY:City:40.71:-73.95:v4; CP=H2; WMF-Last-Access=12-May-2018")'
})

suite.add({
  name: 'reddit.com incognito',
  minSamples: 100,
  fn: 'var val = cookie.parse("loid=00000000001cvli025.2.1526159034681.Z0FBQUFBQmE5MWE2NmY4RDBuelZFU3hOanFvNTNkeG40aUxUTElwYXA1M1NRUVFaNXpmYnJvU1otaVI0bUFqR01oeGdxMmtZYVZVNmRsUElieUdNd2ZqXzhrdDVpZFlyUDB1NUU5LVAxTkhZeS1rN1FDQ1pfVTBWVkNIb1BaX2hycHV4SlhfUzBXS3g; rseor3=true; rabt=; edgebucket=VI96yaB1A21mvFlSza; session_tracker=MFm62M1ZnQ4Y2B46tM.0.1526159044736.Z0FBQUFBQmE5MWJFWjdUb3hxOENoVmxFSy1pYXZ6MHpDZVl3TkxISk1zZC1vdE1kWjVQbGRNZ0QwbTMzS2p1NGZ3Q3AwS2lHbnBKS1B5cGRyTGR1Y0toMVpwNEh4ZXJkTDZSU1pJb2lKdGRlLW5ValFsX0N1S1R4ZE96U256dWFRbW5iSkhYM2dFRmk")'
})

suite.add({
  name: 'yahoo.com incognito',
  minSamples: 100,
  fn: 'var val = cookie.parse("B=3mi7ndddfelsj&b=3&s=mv; GUCS=AcrTO2vd; GUC=AQEBAQBa-J1b3EIgoQTv&s=AQAAAMlcncCm&g=WvdXng; flash_enabled=0; ucs=lnct=1526159253; apeaf=td-applet-stream=%7B%22tmpl%22%3A%22items%22%2C%22lv%22%3A1526161053169%7D; thamba=1; cmp=j=0&t=1526159255")'
})

suite.add({
  name: 'qq.com incognito',
  minSamples: 100,
  fn: 'var val = cookie.parse("ad_play_index=78; qv_als=JtE8dLhh79x2NwxwA11526159108msSmDw==; pac_uid=0_5af7570175564")'
})

suite.add({
  name: 'taobao.com incognito',
  minSamples: 100,
  fn: 'var val = cookie.parse("thw=us; v=0; t=c8440f8a062c00d05b3b3a5a89429e08; cookie2=36231a608e52baa11903a4c69c718412; _tb_token_=e3ef311bb5831; _m_h5_tk=782be65bbe2a22847496b99f0ec68c3c_1526161552605; _m_h5_tk_enc=04d8e971a5674d1b50c7226e8574627b; isg=BFxc6N6XaphlpB7EsYh5tS3bLXzOfQH036553jZdaMcqgfwLXuXQj9Iz5PF5OzhX; uc1=cookie14=UoTeOLirVg2sPw%3D%3D; mt=ci=-1_0")'
})

suite.add({
  name: 'amazon.com incognito',
  minSamples: 100,
  fn: 'var val = cookie.parse("skin=noskin; session-id=146-4209645-0807900; session-id-time=2082787201l; x-wl-uid=11kvQ1P8kXxKcPPuLjpacigQ+L0Vv23KTMoKdvVy46e3DHlzmIilRu4PQJbCHQhfa66hNbGSOMus=; ubid-main=135-9771054-9290718; session-token=yh7qmg4NFVgw8R6kCxz4fUAiWKZuHW0dPfPc1mhN97KQxDUzLV5PJFWsPKq8OP/XFyV4dZjaZsi5zGgJqy9ZUBAckxuU5XyyJ22zGxkNfleCYz/1O33atqRckts4bdqko7jgiiACq1tyHYB9CZSBos2k6bX0GGnS4GfYZDPr7qCqlR5hcatSwXoy7GrUP7IWU/aA7DuU3awjveW1Vrkl5QyFYiDu7PsoXIutgOZSDrOz4u7Cvw343Pem/DrGgI4h; csm-hit=tb:FMRQNYSKC1GN40XXQBMQ+s-VAMEJK5VKKS6D188RY14|1526159373829&adb:adblk_no")'
})

suite.add({
  name: 'twitter.com incognito',
  minSamples: 100,
  fn: 'var val = cookie.parse("personalization_id=\\"v1_V29lqV5nUweGRV8jiKngAg==\\"; _twitter_sess=BAh7CSIKZmxhc2hJQzonQWN0aW9uQ29udHJvbGxlcjo6Rmxhc2g6OkZsYXNo%250ASGFzaHsABjoKQHVzZWR7ADoPY3JlYXRlZF9hdGwrCLNrMFZjAToMY3NyZl9p%250AZCIlOWIxZDY2ODY3NjBiMzEzNTc0YzFhYTllODkxMDZjMTU6B2lkIiUwNjZj%250AYTFjOWQ0ZWYxNWE1ZDkzYzhiZGY0OWE4ZDRjNQ%253D%253D--0b6ef827be9048a7fd366831071d748c31b48484; guest_id=v1%3A152615940395313136; ct0=650bfd4d189312cb9a0300ba3e0c3802")'
})

suite.on('start', function onCycle (event) {
  process.stdout.write('  cookie.parse\n\n')
})

suite.on('cycle', function onCycle (event) {
  benchmarks.add(event.target)
})

suite.on('complete', function onComplete () {
  benchmarks.log()
})

suite.run({async: false})

function gencookies (num) {
  var str = ''

  for (var i = 0; i < num; i++) {
    str += '; foo' + i + '=bar'
  }

  return str.substr(2)
}
