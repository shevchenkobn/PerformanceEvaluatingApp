using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace PerformanceEvaluatingApp.Models
{
    public class WebPage
    {
        public int Id { get; set; }
        [Required]
        public int TestId { get; set; }
        //[Required]
        //public int WebsiteId { get; set; }
        [JsonIgnore]
        [ForeignKey("HttpStatusCode")]
        public int RequestCode { get; set; }

        public string RequestUri { get; set; }
        public double RequestTime { get; set; }
        public string Error { get; set; }
        public DateTime Timestamp { get; set; }
        [JsonIgnore]
        public Test Test { get; set; }
        //[JsonIgnore]
        //public Website Website { get; set; }
        public virtual HttpStatusCode HttpStatusCode { get; set; }
    }
}