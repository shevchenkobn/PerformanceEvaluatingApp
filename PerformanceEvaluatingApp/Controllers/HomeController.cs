using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using AbotX;
using AbotX.Crawler;
using System.Diagnostics;
using PerformanceEvaluatingApp.Models;
using Abot.Crawler;
using System.Data.Entity;
using Abot.Poco;
using System.Net;

namespace PerformanceEvaluatingApp.Controllers
{
    public class HomeController : Controller
    {
        const int DefaultNumberOfTries = 10;
        WebsitesContext _websitesContext = new WebsitesContext();
        CrawlerX _crawler;
        List<WebPage> _sitePages;
        Website _website;
        
        public HomeController()
        {
            _crawler = new CrawlerX();
            _crawler.PageCrawlCompletedAsync += SaveWebsiteUriRequestResult;
            _crawler.PageCrawlDisallowedAsync += SaveWebsiteUriRequestResult;
            _crawler.PageLinksCrawlDisallowedAsync += SaveWebsiteUriRequestResult;
        }
        [HttpGet]
        public ActionResult Index(string address)
        {
            return View();
        }
        [HttpPost,ActionName("Index")]
        public async Task<ActionResult> IndexPost(string address, bool? keepAbsolute, int? numberOfTries)
        {
            Uri url;
            if (Uri.TryCreate(address, UriKind.RelativeOrAbsolute, out url) && (url.Scheme == Uri.UriSchemeHttp || url.Scheme == Uri.UriSchemeHttps))
            {
                if (keepAbsolute == true)
                {
                    string[] addressPieces = address.Split(new string[] { "://", "/" }, StringSplitOptions.RemoveEmptyEntries);
                    address = addressPieces[0] + "://" + addressPieces[1];
                    url = new Uri(address);
                }
            }
            else
            {
                ViewBag.BadUrl = true;
                return View();
            }

            _website = _websitesContext.Websites.Where(w => w.Name == address).SingleOrDefault();
            if (_website == null)
                _website = new Website
                {
                    Name = url.AbsoluteUri
                };
            
            _sitePages = new List<WebPage>();
            for (int i = 0, tries = numberOfTries != null ? (int)numberOfTries : DefaultNumberOfTries; i < numberOfTries; i++)
            {
                var result = await _crawler.CrawlAsync(url);
            }

            UpdateAverageRequestTime();
            UpdateDatabase();

            ViewBag.CrawledWebsite = url.AbsoluteUri;
            return View(_sitePages);
        }

        public ActionResult History(string address)
        {
            Website website;
            if ((website = _websitesContext.Websites.Where(w => w.Name == address).FirstOrDefault()) != null)
            {
                ViewBag.WebsiteName = website.Name;
                return View(website.WebPages);
            }
            else
            {
                ViewBag.WebsiteAbsent = true;
                return View("Index");
            }
        }

        void SaveWebsiteUriRequestResult(object o, CrawlArgs e)
        {
            PageCrawlDisallowedArgs disallowedArgs;
            double requestTime;
            string absoluteUri;
            if ((disallowedArgs = e as PageCrawlDisallowedArgs) != null)
            {
                requestTime = 0;
                absoluteUri = disallowedArgs.PageToCrawl.Uri.AbsoluteUri;
            }
            else
            {
                PageCrawlCompletedArgs crawlCompletedArgs;
                PageLinksCrawlDisallowedArgs linksDisallowedArgs = e as PageLinksCrawlDisallowedArgs;
                if (linksDisallowedArgs != null)
                {
                    absoluteUri = linksDisallowedArgs.CrawledPage.Uri.AbsoluteUri;
                    requestTime = linksDisallowedArgs.CrawledPage.Elapsed;
                }
                else
                {
                    crawlCompletedArgs = e as PageCrawlCompletedArgs;
                    requestTime = crawlCompletedArgs.CrawledPage.Elapsed;
                    absoluteUri = crawlCompletedArgs.CrawledPage.Uri.AbsoluteUri;
                }
            }
            _sitePages.Add(new WebPage
                {
                    WebsiteId = _website.Id,
                    RequestUri = absoluteUri,
                    RequestTime = requestTime,
                    Timestamp = DateTime.Now
                }
            );
        }

        void UpdateDatabase()
        {
            _websitesContext.Entry(_website).State = _website.Id == 0 ?
                                        EntityState.Added :
                                        EntityState.Modified;
            _websitesContext.WebPages.AddRange(_sitePages as IEnumerable<WebPage>);
            _websitesContext.SaveChanges();
        }
        void UpdateAverageRequestTime()
        {
            double oldAverage = _website.AverageRequestTime;
            int tries = _website.Tries;
            _website.AverageRequestTime = (oldAverage * tries + _sitePages.Average(s => s.RequestTime)) / tries + 1;
            _website.Tries++;
        }
    }
}