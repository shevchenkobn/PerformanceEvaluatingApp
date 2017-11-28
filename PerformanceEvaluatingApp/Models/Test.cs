using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;
using Newtonsoft.Json;


namespace PerformanceEvaluatingApp.Models
{
    public class Test
    {
        [Key]
        public int Id { get; set; }
        [JsonIgnore]
        public int RequestIpId { get; set; }
        public int WebsiteId { get; set; }

        public string TestHash { get; set; }
        public DateTime Timestamp { get; set; }
        public double AverageRequestTime { get; set; }
        public int WebPagesCount { get; set; }
        [JsonIgnore]
        public Website Website { get; set; }
        public IpAddressInfo IpAddressInfo { get; set; }
        public ICollection<WebPage> WebPages { get; set; }
        public Test()
        {
            Timestamp = DateTime.Now;
            WebPages = new List<WebPage>();
        }
    }
}