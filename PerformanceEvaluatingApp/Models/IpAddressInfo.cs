using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace PerformanceEvaluatingApp.Models
{
    public class IpAddressInfo
    {
        [Key]
        [JsonIgnore]
        [ForeignKey("Test")]
        public int Id { get; set; }
        public string IpAddress { get; set; }
        public string CountryCode { get; set; }
        public string CountryName { get; set; }
        public string RegionCode { get; set; }
        public string RegionName { get; set; }
        public string City { get; set; }
        public string ZipCode { get; set; }
        public string TimeZone { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public int? MetroCode { get; set; }
        [JsonIgnore]
        public virtual Test Test { get; set; }
    }
}