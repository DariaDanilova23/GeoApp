using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using GeoAuth.Models;
using Microsoft.AspNetCore.Authorization;
using GeoAuth.Data;
using Microsoft.AspNetCore.Identity;
using System.Dynamic;

namespace GeoAuth.Controllers;
//[Authorize(Roles="Admin")]
public class AdminController : Controller
{
 
    private readonly ApplicationDbContext _context;
    private readonly UserManager<IdentityUser> _userManager;

    public AdminController(UserManager<IdentityUser> usermanager, ApplicationDbContext context)
    {

         _userManager = usermanager;
        _context = context;
    }
    public IActionResult Index(){
        
        return View(_context.Users.ToList());
    }
    [HttpGet]
    public async Task <IActionResult> ManageUserRoles(string userId){ // Передача в качестве параметра ID выбранного для изменения пользователя
        List<string> roleids= _context.UserRoles.Where(a => a.UserId == userId).Select(b => b.RoleId).Distinct() .ToList(); //Поиск в таблице Пользователь_Роль пользователя с переданным ID и выбор его id_роли    
        List<IdentityRole> listRole= _context.Roles.Where(a => roleids.Any(c => c == a.Id)).ToList();
     var user=await _userManager.FindByIdAsync(userId);//Поиск пользователя по id
     dynamic mymodel = new ExpandoObject(); //Создание динамического объекта
        mymodel.RoleUser = listRole;//Присваивание ролей пользователя
        mymodel.AllRoles = _context.Roles; //Присваивание всех ролей в системе
        mymodel.User=user; //Присваивание пользователя
        return View(mymodel);
    }
    //[HttpPost]
    //await проверить
     public async Task <IActionResult> DeleteUser(string userId2){
        var user=await _userManager.FindByIdAsync(userId2);//Поиск пользователя по id
        var result=await _userManager.DeleteAsync(user);//Удаление пользователя по id
        return RedirectToAction("Index");
     }

     public async Task <IActionResult> ChangeUser(string userId){
        var user= await _userManager.FindByIdAsync(userId);//Поиск пользователя по id
        var oldRoles = await _userManager.GetRolesAsync(user); //Поиск роли найденного пользователя
        var selectedValue = Request.Form["ChangeUser"].ToString();//Сохраняем в переменную то что выбрано в форме
        //Проверка на равен
        await _userManager.RemoveFromRolesAsync(user, oldRoles.ToArray()); //удаляем старую роль
        await _userManager.AddToRoleAsync(user, selectedValue); //добавляем новую роль
     return RedirectToAction("ManageUserRoles",new {userId=userId}); 
     }
   /*
    public IActionResult Privacy()
    {
        return View();
    }
*/
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
