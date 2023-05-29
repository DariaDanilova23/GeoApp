using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using GeoAuth.Data;

public class Program
{
    public static async Task Main(string[] args)
    {
    var builder = WebApplication.CreateBuilder(args);

    // Add services to the container.
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(connectionString));
    builder.Services.AddDatabaseDeveloperPageExceptionFilter();

    builder.Services.AddDefaultIdentity<IdentityUser>(options => options.SignIn.RequireConfirmedAccount = false)
        .AddRoles<IdentityRole>()
        .AddEntityFrameworkStores<ApplicationDbContext>();
    builder.Services.AddControllersWithViews();

    var app = builder.Build();

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.UseMigrationsEndPoint();
    }
    else
    {
        app.UseExceptionHandler("/Home/Error");
        // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
        app.UseHsts();
    }

    app.UseHttpsRedirection();
    app.UseStaticFiles();

    app.UseRouting();

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}");

    using(var scope=app.Services.CreateScope())
    {
        var roleManager=scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var roles= new[] {"Admin", "User", "Provider"}; //Определение ролей в системе
        foreach (var role in roles) //Выполнение для каждой определенной роли
        {
            if(!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role)); //Добавление роли в систему
        }

    }

    using(var scope=app.Services.CreateScope())// Добавление администратора
    {
        var userManager=scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        string email="admin@admin.ru"; // Задание параметров входа
        string password="Geoserver,112";
        if(await userManager.FindByEmailAsync(email) == null) //Проверка на наличие пользовател в системе
        {
            var user = new IdentityUser();
            user.UserName = email;
            user.Email = email;

            await userManager.CreateAsync(user, password); //Создание пользователя

            await userManager.AddToRoleAsync(user, "Admin"); //Добавление роли

        }

    }


    app.MapRazorPages();

    app.Run();
    }
}