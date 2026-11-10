/* report-preview.test.mjs — run with `node --test tests/`.

   The steps report ("Print steps") opens in the fleet report preview: Print,
   then one Download that follows the File PDF | HTML switch (carino-pdf.js).
   Defended here: the column's markup and order, the strings in every locale,
   and the Download logic (busy while a PDF is made, closes when done, stays
   and says so on failure, the very document handed to the engine). The
   functions are cut out of index.html's inline script and run on stand-ins. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', ROOT), 'utf8');
const i18n = readFileSync(new URL('i18n.js', ROOT), 'utf8');

test('the preview column: status, name, then Print and Download (primary, last); carino-pdf.js is loaded', () => {
    const side = html.slice(html.indexOf('<aside class="rpv-side">'), html.indexOf('</aside>'));
    const order = ['class="rpv-head"', 'class="rpv-status"', 'class="rpv-name"', 'class="rpv-actions"'].map((k) => side.indexOf(k));
    assert.ok(order.every((v, i) => v >= 0 && (i === 0 || v > order[i - 1])), 'column order: ' + order);
    const actions = side.slice(side.indexOf('class="rpv-actions"'));
    const ids = [...actions.matchAll(/<button[^>]*id="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids, ['rpPrint', 'rpDownload']);
    assert.match(actions, /class="btn" id="rpPrint"/);
    assert.match(actions, /class="btn btn-primary" id="rpDownload"/);
    assert.match(html, /<script src="carino-pdf\.js" defer><\/script>/);
    // The switch goes in just above the file name, never in a scrolling block.
    assert.match(html, /\$\('#rpName'\)\.before\(rp\.sw\.el\)/);
});

test('every new string is in every locale; PDF and HTML stay Latin', () => {
    const keys = ['File', 'PDF', 'HTML', 'Download PDF', 'Download HTML', 'Creating the PDF…', 'Could not create the PDF.', 'Report preview'];
    const I18N = new Function(i18n.split(/\nfunction /)[0] + '\nreturn I18N;')();
    for (const loc of ['es', 'pt-BR', 'ja', 'ru']) {
        for (const k of keys) assert.ok(typeof I18N[loc][k] === 'string' && I18N[loc][k], loc + ': ' + k);
        assert.equal(I18N[loc].PDF, 'PDF');
        assert.equal(I18N[loc].HTML, 'HTML');
        assert.match(I18N[loc]['Download PDF'], /PDF/);
    }
});

// The preview's state and Download, cut out of the inline script.
function harness(engine) {
    const src = html.slice(html.indexOf('const rp={'), html.indexOf('function rpPreviewHtml('))
        + html.slice(html.indexOf('// Download: the very document shown'), html.indexOf("$('#mPrint').addEventListener"));
    const els = {};
    const node = (id) => (els[id] = els[id] || { id, textContent: '', disabled: false, before(n) { this.prev = n; } });
    const $ = (sel) => node(sel.replace('#', ''));
    const log = { closed: 0 };
    const win = { CarinoPdf: engine };
    const api = new Function('window', '$', 'T', 'closePreview', 'CarinoPdf', 'document', 'URL', 'Blob',
        src + '\nreturn { rp, rpFormat, rpFileName, rpLabels, rpReady, rpInitFormat, downloadPreview };')(
        win, $, (s) => s, () => { log.closed++; }, engine, {}, {}, function () {});
    return { api, $, log };
}

function fakeEngine() {
    const E = { calls: [], settle: null, value: 'pdf' };
    E.formatSwitch = ({ onChange }) => ({ el: { className: 'rpv-format' }, get: () => E.value, set: (v) => { E.value = v; onChange(v); }, relabel() {} });
    E.label = (f) => (f === 'html' ? 'Download HTML' : 'Download PDF');
    E.fileName = (n, f) => String(n).replace(/\.(pdf|html?)$/i, '') + (f === 'html' ? '.html' : '.pdf');
    E.download = (cfg) => { E.calls.push(cfg); return new Promise((r) => { E.settle = r; }); };
    return E;
}

test('Download as PDF: busy, the document goes to the engine, a failure stays and says so, success closes', async () => {
    const E = fakeEngine();
    const { api, $, log } = harness(E);
    api.rpInitFormat();
    assert.equal($('#rpName').prev.className, 'rpv-format', 'the switch sits just above the name');
    const built = { html: '<!DOCTYPE html><html><head><title>SHA-256 — steps</title></head><body>s</body></html>', title: 'SHA-256 — steps', name: 'carino-hash-sha256-steps-2026-11-10' };
    api.rp.stem = built.name; api.rpLabels();
    assert.equal($('#rpDownload').textContent, 'Download PDF');
    assert.equal($('#rpName').textContent, 'carino-hash-sha256-steps-2026-11-10.pdf');
    api.rp.open = true; api.rp.built = built; api.rpReady();
    assert.ok(!$('#rpDownload').disabled);
    const job = api.downloadPreview();
    assert.ok($('#rpDownload').disabled && !$('#rpPrint').disabled, 'Download off, Print on');
    assert.equal($('#rpStatus').textContent, 'Creating the PDF…');
    assert.deepEqual(E.calls[0], { html: built.html, name: built.name, format: 'pdf', title: built.title, producer: 'Carino Hash' });
    E.settle({ ok: false, error: 'canvas' });
    await job;
    assert.equal(log.closed, 0);
    assert.ok(!$('#rpDownload').disabled);
    assert.equal($('#rpStatus').textContent, 'Could not create the PDF.');
    const again = api.downloadPreview();
    E.settle({ ok: true });
    await again;
    assert.equal(log.closed, 1);
});

test('the switch on HTML: label and name follow, and the HTML file is asked for', async () => {
    const E = fakeEngine();
    const { api, $, log } = harness(E);
    api.rpInitFormat();
    api.rp.stem = 'carino-hash-lamport-steps-2026-11-10'; api.rpLabels();
    api.rp.sw.set('html');
    assert.equal($('#rpDownload').textContent, 'Download HTML');
    assert.equal($('#rpName').textContent, 'carino-hash-lamport-steps-2026-11-10.html');
    api.rp.open = true; api.rp.built = { html: '<p>l</p>', title: 'Lamport — steps', name: api.rp.stem }; api.rpReady();
    const job = api.downloadPreview();
    assert.equal(E.calls[0].format, 'html');
    assert.notEqual($('#rpStatus').textContent, 'Creating the PDF…');
    E.settle({ ok: true });
    await job;
    assert.equal(log.closed, 1);
});

test('a PDF still being made when the report is redrawn: the new document gets its Download back', async () => {
    const E = fakeEngine();
    const { api, $ } = harness(E);
    api.rpInitFormat();
    api.rp.open = true; api.rp.seq = 1; api.rp.built = { html: '<p>1</p>', title: 't', name: 'n' }; api.rpReady();
    const job = api.downloadPreview();
    api.rp.seq = 2;   // a language change redrew it
    api.rpReady();
    assert.ok($('#rpDownload').disabled, 'still busy');
    E.settle({ ok: true });
    await job;
    assert.ok(!$('#rpDownload').disabled);
});
