using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
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
using System.Text;

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
        private HttpCodeModel[] _cachedCodes;

        private StringContent MakeJsonContent(object json)
        {   
            return new StringContent(json.ToString(), Encoding.UTF8, "application/json");
        }
        // GET: websites/
        [Route("")]
        public HttpResponseMessage GetWebsites()
        {
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = MakeJsonContent(JsonConvert.SerializeObject(_dbContext.Websites))
            };
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
            var jTests = new JArray();
            var tests = _dbContext.Tests.Where(t => t.Website.Id == _website.Id).ToArray();
            foreach (var test in tests)
            {
                var jTest = JObject.FromObject(test);
                jTest.Add("WebsiteName", test.Website.Name);
                jTests.Add(jTest);
            }
            var json = JObject.FromObject(_website);
            json.Add("Tests", jTests);
            response.Content = MakeJsonContent(json);

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
            response.Content = MakeJsonContent(json);

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
            json.Add("WebsiteName", _test.Website.Name);
            response.Content = MakeJsonContent(json);

            return response;
        }

        // GET: websites/tests
        [Route("tests/")]
        public HttpResponseMessage GetTests()
        {
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = MakeJsonContent(
                    JsonConvert.SerializeObject(_dbContext.Tests.Include("IpAddressInfo"))
                )
            };
        }

        // POST: websites/
        [HttpPost]
        [Route("")]
        public async Task<HttpResponseMessage> TestWebsite()
        {
            var urlString = await Request.Content.ReadAsStringAsync();
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
            json.Add("WebsiteName", JToken.FromObject(_test.Website.Name));
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = MakeJsonContent(json.ToString())
            };
        }

        #region privateMethodsForPOST

        

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
            _cachedCodes = _dbContext.HttpStatusCodes.ToArray();
            WebPage webPage = null;
            crawler.PageCrawlStartingAsync += (sender, args) =>
            {
                if (args?.PageToCrawl?.Uri == null)
                {
                    return;
                }
                webPage = new WebPage
                {
                    RequestUri = args.PageToCrawl.Uri.AbsoluteUri,
                    Test = _test,
                    Timestamp = DateTime.UtcNow
                };
            };
            crawler.PageCrawlDisallowedAsync += (sender, args) =>
            {
                if (webPage != null && args != null)
                {
                    webPage.RequestTime = -1;
                    webPage.Error = args.DisallowedReason;
                    _webPages.Add(webPage);
                }
            };
            crawler.PageCrawlCompletedAsync += (sender, args) =>
            {
                if (webPage != null && args?.CrawledPage != null)
                {
                    var crawledPage = args.CrawledPage;
                    webPage.RequestTime = crawledPage.Elapsed;
                    webPage.HttpStatusCode = _cachedCodes.SingleOrDefault(
                        c => c.Code == (crawledPage?.HttpWebResponse == null ?
                            0 : (int)crawledPage.HttpWebResponse.StatusCode)
                    );// otherwise search for code in table
                    webPage.Test = _test;
                    _webPages.Add(webPage);
                }
            };
            if ((await crawler.CrawlAsync(_url)).ErrorOccurred || _webPages.Count == 0)
            {
                return false;
            }
            _test.Timestamp = _webPages[0].Timestamp;
            _test.AverageRequestTime = _webPages.Average(p => p.RequestTime);
            _test.WebPagesCount = _webPages.Count;
            return true;
        }

        private async Task<bool> SaveToDatabase()
        {
            try
            {
                int count = 0;
                _dbContext.Entry(_website).State = _website.Id == 0 ? EntityState.Added : EntityState.Modified;
                _dbContext.Tests.Add(_test);
                //_dbContext.IpAddressInfos.Add(_ipInfo);
                //count += await _dbContext.SaveChangesAsync();
                _dbContext.Entry(_ipInfo).State = EntityState.Added;
                //count += await _dbContext.SaveChangesAsync();
                _dbContext.WebPages.AddRange(_webPages);
                count += await _dbContext.SaveChangesAsync();
                if (count == 0)
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
            catch (Exception e)
            {
                return false;
            }
        }

        private string GetTestHash()
        {
            var inputKey = _website.Id + "/" + _test.Id;
            return BCrypt.Net.BCrypt.HashPassword(inputKey, 4);
        }
        #endregion

        [Route("")]
        public async Task<HttpResponseMessage> DeleteTest()
        {
            var testHash = await Request.Content.ReadAsStringAsync();
            _test = _dbContext.Tests.FirstOrDefault(t => t.TestHash == testHash);
            if (_test == null)
            {
                return new HttpResponseMessage(HttpStatusCode.NotFound);
            }
            var json = new JObject();
            if (MarkTestOnlyForDeletion())
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
                Content = MakeJsonContent(json.ToString())
            };
        }

        private bool MarkTestOnlyForDeletion()
        {
            _website = _test.Website;
            _dbContext.Entry(_test.IpAddressInfo).State = EntityState.Deleted;
            foreach (var webPage in _dbContext.WebPages.Where(p => p.TestId == _test.Id))
            {
                _dbContext.Entry(webPage).State = EntityState.Deleted;
            }
            _dbContext.Entry(_test).State = EntityState.Deleted;
            if (_dbContext.Tests.Count(t => t.WebsiteId == _website.Id) == 1)
            {
                _dbContext.Entry(_website).State = EntityState.Deleted;
                return false;
            }
            return true;
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