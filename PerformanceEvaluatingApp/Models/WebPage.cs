using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace PerformanceEvaluatingApp.Models
{
    public class WebPage
    {
        public int Id { get; set; }
        public int TestId { get; set; }
        public int WebsiteId { get; set; }
        public int RequestCode { get; set; }

        public string RequestUri { get; set; }
        public double RequestTime { get; set; }
        public DateTime Timestamp { get; set; }
        [JsonIgnore]
        public Test Test { get; set; }
        [JsonIgnore]
        public Website Website { get; set; }
        public HttpStatusCode HttpStatusCode { get; set; }

        public WebPage()
        {
            Timestamp = DateTime.Now;
        }
    }
}