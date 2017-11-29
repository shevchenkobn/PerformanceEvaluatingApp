﻿using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Runtime.Remoting.Channels;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Description;
using System.Web.Routing;
using System.Web.WebPages.Deployment;
using System.Web.WebSockets;
using AbotX.Crawler;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using PerformanceEvaluatingApp.Models;
using HttpCodeModel = PerformanceEvaluatingApp.Models.HttpStatusCode;
using HttpStatusCode = System.Net.HttpStatusCode;


namespace PerformanceEvaluatingApp.Controllers
{
    [RoutePrefix("websites")]
    public class WebsitesController : ApiController
    {
        private const string IpInfoUrl = "http://freegeoip.net/json/";
        private readonly WebsitesContext _dbContext = new WebsitesContext();
        private Uri _url;
        private IpAddressInfo _ipInfo;
        private Test _test;
        private Website _website;
        private List<WebPage> _webPages;


        // GET: websites/
        [Route("")]
        public string GetWebsites()
        {
            return JsonConvert.SerializeObject(_dbContext.Websites);
        }

        // GET: websites/5
        [Route("{id:int}")]
        public async Task<HttpResponseMessage> GetTests(int id)
        {
            _website = await _dbContext.Websites.FindAsync(id);
            if (_website == null)
            {
                return new HttpResponseMessage(HttpStatusCode.NotFound);
            }
            var response = Request.CreateResponse(HttpStatusCode.OK);
            var json = JObject.FromObject(_website);
            json.Add("Tests", JToken.FromObject(_website.Tests));
            response.Content = new StringContent(json.ToString());

            return response;
        }

        // GET: websites/5/webpages
        [Route("{id:int:min(1)}/webpages")]
        public async Task<HttpResponseMessage> GetAllWebpages(int id)
        {
            _website = await _dbContext.Websites.FindAsync(id);
            if (_website == null)
            {
                return new HttpResponseMessage(HttpStatusCode.NotFound);
            }
            var response = Request.CreateResponse(HttpStatusCode.OK);
            _webPages = new List<WebPage>();
            foreach (var test in _website.Tests)
            {
                _webPages.AddRange(test.WebPages);
            }
            var json = JObject.FromObject(_website);
            json.Add("WebPages", JToken.FromObject(_webPages));
            response.Content = new StringContent(json.ToString());

            return response;
        }

        // GET: websites/test/3
        [Route("test/{id:int:min(1)}")]
        public async Task<HttpResponseMessage> GetWebpages(int id)
        {
            _test = await _dbContext.Tests.FindAsync(id);
            if (_test == null)
            {
                return new HttpResponseMessage(HttpStatusCode.NotFound);
            }
            var response = Request.CreateResponse(HttpStatusCode.OK);
            var json = JObject.FromObject(_test);
            json.Add("WebPages", JToken.FromObject(_test.WebPages));
            response.Content = new StringContent(json.ToString());

            return response;
        }

        // GET: websites/tests
        [Route("tests/")]
        public string GetTests()
        {
            return JsonConvert.SerializeObject(_dbContext.Tests);
        }

        // POST: websites/
        [HttpPost]
        [Route("")]
        public async Task<HttpResponseMessage> TestWebsite([FromBody]string urlString)
        {
            if (!SaveSetWebsite(urlString))
            {
                return new HttpResponseMessage(HttpStatusCode.BadRequest)
                {
                    Content = new StringContent("Bad Url")
                };
            }
            if (!await SaveIpInfo())
            {
                return new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
                {
                    Content = new StringContent("Get IpInfo Failed")
                };
            }
            if (!await CrawlAsync())
            {
                return new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
                {
                    Content = new StringContent("Testing Error")
                };
            }
            if (!await SaveToDatabase())
            {
                return new HttpResponseMessage(HttpStatusCode.InternalServerError)
                {
                    Content = new StringContent("Failed To Save")
                };
            }
            var json = JObject.FromObject(_test);
            json.Add("TestHash", _test.TestHash);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json.ToString())
            };
        }

        private bool SaveSetWebsite(string urlString)
        {
            if (!(Uri.TryCreate(urlString, UriKind.Absolute, out _url) &&
                (_url.Scheme == Uri.UriSchemeHttp || _url.Scheme == Uri.UriSchemeHttps)))
            {
                return false;
            }
            _website = _dbContext.Websites.SingleOrDefault(w => w.Name == _url.AbsoluteUri)
                ?? new Website
                       {
                           Name = _url.AbsoluteUri
                       };
            return true;
        }

        private async Task<bool> SaveIpInfo()
        {
            try
            {
                var webClient = new WebClient();
                var jObject = JObject.Parse(
                    await webClient.DownloadStringTaskAsync(new Uri(IpInfoUrl + _url.Host))
                );
                if (jObject == null)
                {
                    return false;
                }
                _ipInfo = new IpAddressInfo
                {
                    // TODO: make a breakpoint here and fill ipinfo with values
                    IpAddress = jObject["ip"].ToString(),
                    CountryCode = jObject["country_code"].ToString(),
                    CountryName = jObject["country_name"].ToString(),
                    RegionCode = jObject["region_code"].ToString(),
                    RegionName = jObject["region_name"].ToString(),
                    City = jObject["city"].ToString(),
                    ZipCode = jObject["zip_code"].ToString(),
                    TimeZone = jObject["time_zone"].ToString()
                };
                if (double.TryParse(jObject["latitude"].ToString(), out var temp))
                {
                    _ipInfo.Latitude = temp;
                }
                if (double.TryParse(jObject["longitude"].ToString(), out temp))
                {
                    _ipInfo.Longitude = temp;
                }
                if (int.TryParse(jObject["metro_code"].ToString(), out int t))
                {
                    _ipInfo.MetroCode = t;
                }
                return true;
            }
            catch
            {
                return false;
            }
        }

        private async Task<bool> CrawlAsync()
        {
            var crawler = new CrawlerX();
            _ipInfo.Test = _test = new Test
            {
                Website = _website,
                IpAddressInfo = _ipInfo
            };
            _webPages = new List<WebPage>();
            WebPage webPage = null;
            crawler.PageCrawlStartingAsync += (sender, args) =>
            {
                webPage = new WebPage
                {
                    RequestUri = args.PageToCrawl.Uri.AbsoluteUri,
                    Test = _test,
                    Timestamp = DateTime.UtcNow
                };
            };
            crawler.PageCrawlDisallowedAsync += (sender, args) =>
            {
                if (webPage != null)
                {
                    webPage.RequestTime = -1;
                    webPage.Error = args.DisallowedReason;
                    _webPages.Add(webPage);
                }
            };
            crawler.PageCrawlCompletedAsync += (sender, args) =>
            {
                if (webPage != null)
                {
                    var crawledPage = args.CrawledPage;
                    webPage.RequestTime = crawledPage.Elapsed;
                    webPage.RequestCode = (int) crawledPage.HttpWebResponse.StatusCode; // otherwise search for code in table
                    _webPages.Add(webPage);
                }
            };
            if (!(await crawler.CrawlAsync(_url)).ErrorOccurred)
            {
                return false;
            }
            _test.Timestamp = _webPages[0].Timestamp;
            return true;
        }

        private async Task<bool> SaveToDatabase()
        {
            try
            {
                _dbContext.Entry(_website).State = _website.Id == 0 ? EntityState.Added : EntityState.Modified;
                _dbContext.Tests.Add(_test);
                _dbContext.IpAddressInfos.Add(_ipInfo);
                _dbContext.WebPages.AddRange(_webPages);
                if (await _dbContext.SaveChangesAsync() == 0)
                {
                    return false;
                }
                _test.TestHash = GetTestHash();
                _dbContext.Entry(_test).State = EntityState.Modified;
                if (await _dbContext.SaveChangesAsync() == 0)
                {
                    return false;
                }
                return true;
            }
            catch
            {
                return false;
            }
        }

        private string GetTestHash()
        {
            var inputKey = _website.Id + "/" + _test.Id;
            return BCrypt.Net.BCrypt.HashPassword(inputKey, 4);
        }

        [Route("{testHash}")]
        public async Task<HttpResponseMessage> DeleteTest(string testHash)
        {
            _test = _dbContext.Tests.FirstOrDefault(t => t.TestHash == testHash);
            if (_test == null)
            {
                return new HttpResponseMessage(HttpStatusCode.NotFound);
            }
            _dbContext.Entry(_test).State = EntityState.Deleted;
            var json = new JObject();
            if (_dbContext.Tests.Count(t => t.WebsiteId == _test.WebsiteId) == 1)
            {
                _dbContext.Entry(_test.Website).State = EntityState.Deleted;
            }
            else
            {
                json.Add("WebsiteId", _test.WebsiteId);
            }
            if (await _dbContext.SaveChangesAsync() == 0)
            {
                return new HttpResponseMessage(HttpStatusCode.InternalServerError)
                {
                    Content = new StringContent("Failed To Delete")
                };
            }

            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json.ToString())
            };
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _dbContext.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}