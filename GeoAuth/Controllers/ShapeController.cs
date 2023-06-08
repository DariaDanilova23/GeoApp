using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using GeoAuth.Models;
using GeoAuth.Data;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using System.Text;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Hosting;

namespace GeoAuth.Controllers
{
    [Authorize]
    [Route("[controller]")]
    public class ShapeController : Controller
    {
     //   private readonly ILogger<ShapeController> _logger; 
      //  private readonly ApplicationDbContext _context;
     //   private readonly UserManager<IdentityUser> _userManager;
     // ILogger<ShapeController> logger, IWebHostEnvironment appEnvironment
    IWebHostEnvironment _appEnvironment; 

        public ShapeController( IWebHostEnvironment appEnvironment)
        {
            //_logger = logger;
            _appEnvironment = appEnvironment;
        }
        [HttpGet("/Shape")]
        public IActionResult Index()
        {
            return View("Index");
        }
//---------------------------

        public string CreateDbDataStore(string ws, string dsName)
    {
        String gUrl = "http://localhost:8080/geoserver/rest/workspaces/" + ws + "/datastores.xml";
        WebRequest request = WebRequest.Create(gUrl);

        request.ContentType = "application/xml";
        request.Method = "POST";
        request.Credentials = new NetworkCredential("admin", "geoserver");
        string dbXml = getDbXml(dsName);

        byte[] buffer = Encoding.GetEncoding("UTF-8").GetBytes(dbXml);
        Stream requestStream = request.GetRequestStream();
        requestStream.Write(buffer, 0, buffer.Length);
        requestStream.Close();

        WebResponse response = request.GetResponse();
        Console.Write("Response from GeoServer: " + response);
       // CreatePostGISTableAndFeatureType(ws, dsName, dsName,"EPSG:4326");
        return dsName;
    }
    private string getDbXml(string dsName)
    {
        string dbHost = "localhost";
        string dbPort = "5432";
        string dbName = "GeoDB";
        string dbUser = "postgres";
        string dbPassword = "123";
        string dbType = "postgis";
        string exposePKsParameter = "<entry key='Expose primary keys' value='true'/>";
      //  string exposePKsParameter = "<entry key='Expose primary keys'>true</entry>";

        string xml = "<dataStore>" +
                        "<name>" + dsName + "</name>" + 
                        "<enabled>true</enabled>" + 
                        "<connectionParameters>" + 
                            "<host>" + dbHost + "</host>" + 
                            "<port>" + dbPort + "</port>" + 
                            "<database>" + dbName + "</database>" + 
                            "<user>" + dbUser + "</user>" + 
                            "<passwd>" + dbPassword + "</passwd>" +
                            "<dbtype>" + dbType + "</dbtype>" + 
                            "<namespace>" + "geoportal" + "</namespace>" + 
                            //_NS
                            //"<Expose primary keys>true</Expose primary keys>"+
                         "</connectionParameters>" + 
                        
                      "</dataStore>";
        return xml;
    }

    //-----------------
        public bool CreatePostGISTableAndFeatureType(string ws, string ds, string title, string projection)
    {
        string featXml = GetFeatureXml(ds, title, projection);
        string fUrl = "http://localhost:8080/geoserver/rest/workspaces/" + ws +
                        "/datastores/"+ds+"/featuretypes";
        
        WebRequest request = WebRequest.Create(fUrl);
        Console.Write(fUrl);
        request.ContentType = "application/xml";
        request.Method = "POST";
        request.Credentials = new NetworkCredential("admin", "geoserver");

        byte[] buffer = Encoding.GetEncoding("UTF-8").GetBytes(featXml);

        Stream requestStream = request.GetRequestStream();
        requestStream.Write(buffer, 0, buffer.Length);
        requestStream.Close();

        WebResponse response = request.GetResponse();
        Console.Write(response);
    
        return false;
    }

    private string GetFeatureXml(string dsName, string title, string projection)
    {
        string fXml = "<featureType>" +
                            "<name>" + dsName + "</name>" +
                            "<nativeName>" + dsName + "</nativeName>" +
                            "<title>" + title + "</title>" +
                            "<srs>" + projection + "</srs>" +
                            "<attributes>" +
                                "<attribute>" +
                                    "<name>myname</name>" +
                                    "<binding>java.lang.String</binding>" +
                                "</attribute>" +
                                "<attribute>" +
                                    "<name>geom</name>" +
                                    "<binding>com.vividsolutions.jts.geom.Polygon</binding>" +
                                "</attribute>" +
                                "<attribute>" +
                                    "<name>description</name>" +
                                    "<binding>java.lang.String</binding>" +
                                "</attribute>" +
                                "<attribute>" +
                                    "<name>timestamp</name>" +
                                    "<binding>java.util.Date</binding>" +
                                "</attribute>" +
                            "</attributes>" +
                        "</featureType>";
                        Console.Write(fXml);
        return fXml;
    }
    //---------------------------------
      /*  public async Task createdWorkspace(string my_workspace)
        {
            try
            {
                string url = "http://localhost:8080/geoserver/rest/workspaces";
                using var client = new HttpClient();
                var authString = Convert.ToBase64String(Encoding.UTF8.GetBytes("admin:geoserver"));
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authString);
                var buffer = "<workspace><name>" + my_workspace + "</name></workspace>";
                var httpContent = new StringContent(buffer, Encoding.UTF8, "application/xml");
                var response = await client.PostAsync(url, httpContent);
                var result = await response.Content.ReadAsStringAsync();
                Console.WriteLine(result);
            }
            catch
            {

            }
        }
*/
         public bool UploadShapeFile(string workspace, string dsName)
    {
        //String fileUri = zipUri.AbsolutePath;
        //Console.Write(fileUri);
        string fileUri=_appEnvironment.WebRootPath + "/file/file.shp";
        byte[] localShapeFile = readLocalShapeFile(fileUri);

        String sUrl = "http://localhost:8080/geoserver/rest/workspaces/" + 
                        workspace + "/datastores/" + 
                        dsName + "/file.shp";

        WebRequest request = WebRequest.Create(sUrl);

        request.ContentType = "application/zip";
        request.Method = "PUT";
        request.Credentials = new NetworkCredential("admin", "geoserver");

        Stream requestStream = request.GetRequestStream();
        requestStream.Write(localShapeFile, 0, localShapeFile.Length);
        requestStream.Close();

        WebResponse response = request.GetResponse();
        Console.Write("Response from GeoServer: " + response);


        return false;
    }

    private byte[] readLocalShapeFile(string filePath)
    {
        byte[] buffer;
        FileStream fStream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        try {
            int length = (int)fStream.Length; 
            buffer = new byte[length]; 
            int count;
            int sum = 0;

            while ((count = fStream.Read(buffer, sum, length - sum)) > 0)
                sum += count;
        }
        finally {
            fStream.Close();
        }

        return buffer;
    }
        //public async Task<IActionResult> AddFile(IFormFile uploadedFile)
        [HttpPost]
        public async Task<IActionResult> AddFile(IFormFile uploadedFile)
        {
            string link = "";
            var userId = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var userRole = User.FindFirst(ClaimTypes.Role).Value;
            string filename = Request.Form["fname"].ToString();
            if (userRole == "User") //если пользователь в роли обычного пользователя
            {
          //    await  createdWorkspace(userId); //вызов функции создания workspace с названием соответствующим id пользователя
                link = userId;
            }
            else if (userRole == "Provider") //если пользователь в роли поставщик
            {
                link = "geoportal";
                CreateDbDataStore(link, filename);
                //string ws, string ds, string title, string projection
                CreatePostGISTableAndFeatureType(link, filename, filename,"EPSG:4326");
                //UploadShapeFile(link,filename);
            }


         String sUrl = "http://localhost:8080/geoserver/rest/workspaces/" + link + "/datastores/" + filename + "/file.shp";
                using var client = new HttpClient();
                var authString = Convert.ToBase64String(Encoding.UTF8.GetBytes("admin:geoserver"));
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authString);

                long length = uploadedFile.Length;//Определение длины файла
                using var fileStream = uploadedFile.OpenReadStream(); //Открытие потока для чтения
                byte[] buffer = new byte[length];//Создание буфера 
                fileStream.Read(buffer, 0, (int)uploadedFile.Length);// Чтение байтов из потока и запись данных в буфер.

                var content = new ByteArrayContent(buffer);
                content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");
                //content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/xml");

                var response = client.PutAsync(sUrl, content).Result;

            return RedirectToAction("Index", "Home");
        }
        
//  ВОТ ЭТО
/*
  public async Task createdWorkspace(string my_workspace)
        {
            try
            {
                string url = "http://localhost:8080/geoserver/rest/workspaces";
                using var client = new HttpClient();
                var authString = Convert.ToBase64String(Encoding.UTF8.GetBytes("admin:geoserver"));
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authString);
                var buffer = "<workspace><name>" + my_workspace + "</name></workspace>";
                var httpContent = new StringContent(buffer, Encoding.UTF8, "application/xml");
                var response = await client.PostAsync(url, httpContent);
                var result = await response.Content.ReadAsStringAsync();
                Console.WriteLine(result);
            }
            catch
            {

            }
        }
        [HttpPost]
        public async Task<IActionResult> AddFile(IFormFile uploadedFile)
        {
            string link = "";
            var userId = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            var userRole = User.FindFirst(ClaimTypes.Role).Value;
            if (userRole == "User") //если пользователь в роли обычного пользователя
            {
              await  createdWorkspace(userId); //вызов функции создания workspace с названием соответствующим id пользователя
                link = userId;
            }
            else if (userRole == "Provider") //если пользователь в роли поставщик
            {
                link = "geoportal";
            }
            string filename = Request.Form["fname"].ToString();
            if (uploadedFile != null && filename != null)
            {
                String sUrl = "http://localhost:8080/geoserver/rest/workspaces/" + link + "/datastores/" + filename + "/file.kml.xml";
                using var client = new HttpClient();
                var authString = Convert.ToBase64String(Encoding.UTF8.GetBytes("admin:geoserver"));
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authString);

                long length = uploadedFile.Length;//Определение длины файла
                using var fileStream = uploadedFile.OpenReadStream(); //Открытие потока для чтения
                byte[] buffer = new byte[length];//Создание буфера 
                fileStream.Read(buffer, 0, (int)uploadedFile.Length);// Чтение байтов из потока и запись данных в буфер.

                var content = new ByteArrayContent(buffer);
                content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");
                //content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/xml");

                var response = client.PutAsync(sUrl, content).Result;
            }
            return RedirectToAction("Index", "Home");
        }
*/
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}