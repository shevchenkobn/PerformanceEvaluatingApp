using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;

namespace PerformanceEvaluatingApp.Models
{
    public class Website
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; }
        public double AverageRequestTime { get; set; }
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Tries { get; set; }
        public ICollection<WebPage> WebPages { get; set; }

        public Website()
        {
            WebPages = new List<WebPage>();
        }
    }
}