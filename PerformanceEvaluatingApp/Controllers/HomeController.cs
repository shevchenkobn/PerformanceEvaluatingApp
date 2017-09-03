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
    public enum Errors
    {
        BadUrlGiven, NoTestedWebsites, WebsiteIsNotTested, CrawlerError
    }
    public class HomeController : Controller
    {
        const int DefaultNumberOfTries = 10;
        const int MaxNumberOfTries = 25;
        const int MinNumberOfTries = 2;
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
            SetIndexActionFormAttributes();
            return View();
        }
        [HttpPost,ActionName("Index")]
        public async Task<ActionResult> IndexPost(string address, bool? startFromCurrentLocation, int? numberOfTries)
        {
            SetIndexActionFormAttributes();
            Uri url;
            if (Uri.TryCreate(address, UriKind.RelativeOrAbsolute, out url) && (url.Scheme == Uri.UriSchemeHttp || url.Scheme == Uri.UriSchemeHttps))
            {
                if (startFromCurrentLocation != true)
                {
                    string[] addressPieces = address.Split(new string[] { "://", "/" }, StringSplitOptions.RemoveEmptyEntries);
                    address = addressPieces[0] + "://" + addressPieces[1];
                    url = new Uri(address);
                }
            }
            else
            {
                ViewBag.Error = Errors.BadUrlGiven;
                return View();
            }

            _website = _websitesContext.Websites.Where(w => w.Name == address).SingleOrDefault();
            if (_website == null)
                _website = new Website
                {
                    Name = url.AbsoluteUri
                };
            
            _sitePages = new List<WebPage>();
            int tries;
            if (numberOfTries == null || numberOfTries < MinNumberOfTries || numberOfTries > MaxNumberOfTries)
                tries = DefaultNumberOfTries;
            else
                tries = (int)numberOfTries;
            for (int i = 0; i < tries; i++)
            {
                var result = await _crawler.CrawlAsync(url);
                if (result.ErrorOccurred)
                {
                    ViewBag.Error = Errors.CrawlerError;
                    if (ViewBag.FailedTries == null)
                        ViewBag.FailedTries = 1;
                    else
                        ViewBag.FailedTries++;
                }
            }

            UpdateAverageRequestTime();
            UpdateDatabase();

            ViewBag.CrawledWebsite = url.AbsoluteUri;
            return View(_sitePages);
        }

        public ActionResult History(string address)
        {
            if (_websitesContext.Websites.Count() == 0)
            {
                ViewBag.Error = Errors.NoTestedWebsites;
                return View("Index");
            }
            else if (string.IsNullOrEmpty(address))
                return View("ListWebsites", _websitesContext.Websites);
            Website website;
            ViewBag.WebsiteName = address;
            if ((website = _websitesContext.Websites.Where(w => w.Name == address).FirstOrDefault()) != null)
            {
                return View("ListSitePages", website.WebPages);
            }
            else
            {
                ViewBag.Error = Errors.WebsiteIsNotTested;
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
            double currentAverage = 0;
            if (_sitePages.Count > 0)
                currentAverage = _sitePages.Average(s => s.RequestTime);
            _website.AverageRequestTime = (oldAverage * tries + currentAverage) / (tries + 1);
            _website.Tries++;
        }
        void SetIndexActionFormAttributes()
        {
            ViewBag.DefaultNumberOfTries = 10;
            ViewBag.MaxNumberOfTries = 25;
            ViewBag.MinNumberOfTries = 2;
        }
    }
}