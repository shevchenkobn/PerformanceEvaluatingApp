using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace PerformanceEvaluatingApp.Models
{
    public class Website
    {
        [Key]
        public int Id { get; set; }
        [Index(IsUnique = true)]
        [MaxLength(450)]
        public string Name { get; set; }
        public double AverageRequestTime { get; set; }
        public int Tries { get; set; }
        [JsonIgnore]
        public ICollection<WebPage> WebPages { get; set; }

        public Website()
        {
            WebPages = new List<WebPage>();
        }
    }
}