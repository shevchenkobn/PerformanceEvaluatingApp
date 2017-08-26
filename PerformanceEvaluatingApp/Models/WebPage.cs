using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PerformanceEvaluatingApp.Models
{
    public class WebPage
    {
        public int Id { get; set; }
        public int WebseteId { get; set; }
        public string RequestUri { get; set; }
        public DateTime Timestamp { get; set; }

        public WebPage()
        {
            Timestamp = DateTime.Now;
        }
    }
}