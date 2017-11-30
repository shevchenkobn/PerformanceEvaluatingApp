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
using Newtonsoft.Json;

namespace PerformanceEvaluatingApp.Controllers
{
    public enum Errors
    {
        NoErrors, BadUrlGiven, NoTestedWebsites, WebsiteIsNotTested, CrawlerError
    }
    public class MainController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }
    }
}