"""Verify the actual public sitemap, HTTP semantics and every indexable target."""
import concurrent.futures
import hashlib
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

ORIGIN = 'https://tiancinge-web.web.app'

def request(url, method='GET', agent='sitemap-verifier'):
    return urllib.request.urlopen(urllib.request.Request(url, method=method, headers={'User-Agent': agent}), timeout=45)

class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = []
        self.noindex = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name', '').lower() in ('robots', 'googlebot'):
            self.noindex |= 'noindex' in attrs.get('content', '').lower()

def verify_page(url):
    with request(url) as response:
        assert response.status == 200 and response.url == url, f'Redirect or status: {url}'
        assert 'noindex' not in response.headers.get('X-Robots-Tag', '').lower(), url
        parser = Metadata()
        parser.feed(response.read().decode('utf-8'))
        assert not parser.noindex, f'Noindex: {url}'
        normalize = lambda value: urllib.parse.unquote(value or '').removesuffix('/') if value in (ORIGIN, ORIGIN + '/') else urllib.parse.unquote(value or '')
        canonical = [normalize(value) for value in parser.canonical]
        assert canonical == [normalize(url)], f'Canonical mismatch: {url}: {canonical}'
    return url

if __name__ == '__main__':
    sitemap_bodies = {}
    for method, agent in [('GET', 'sitemap-verifier'), ('HEAD', 'sitemap-verifier'), ('GET', 'Googlebot')]:
        with request(ORIGIN + '/sitemap.xml', method, agent) as response:
            assert response.status == 200 and response.url == ORIGIN + '/sitemap.xml'
            content_type = response.headers.get('Content-Type', '').lower()
            assert content_type.startswith('application/xml'), content_type
            assert 'noindex' not in response.headers.get('X-Robots-Tag', '').lower()
            if method == 'GET':
                body = response.read()
                sitemap_bodies[agent] = body
                assert body.startswith(b'<?xml version="1.0" encoding="UTF-8"?>'), 'Missing UTF-8 XML declaration'
                root = ET.fromstring(body)
    assert sitemap_bodies['sitemap-verifier'] == sitemap_bodies['Googlebot'], (
        'Googlebot sitemap body differs from normal crawler body: '
        f"{hashlib.sha256(sitemap_bodies['sitemap-verifier']).hexdigest()} != "
        f"{hashlib.sha256(sitemap_bodies['Googlebot']).hexdigest()}"
    )
    assert root.tag == '{http://www.sitemaps.org/schemas/sitemap/0.9}urlset'
    urls = [item.text for item in root.findall('{*}url/{*}loc')]
    assert len(urls) == len(set(urls)) and urls
    assert all(url.startswith(ORIGIN + '/') and '#' not in url for url in urls)
    with request(ORIGIN + '/robots.txt') as response:
        assert response.status == 200 and response.url == ORIGIN + '/robots.txt'
        assert response.headers.get('Content-Type', '').lower().startswith('text/plain')
        robots = response.read().decode('utf-8')
        assert 'Sitemap: ' + ORIGIN + '/sitemap.xml' in robots
        assert 'Disallow: /search' in robots
        assert '<html' not in robots.lower()
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        checked = list(pool.map(verify_page, urls))
    print(json.dumps({'verified': len(checked), 'urls': checked}, ensure_ascii=False, indent=2))
