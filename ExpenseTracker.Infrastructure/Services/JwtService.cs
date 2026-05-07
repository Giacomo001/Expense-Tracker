using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ExpenseTracker.Application.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ExpenseTracker.Infrastructure.Services;

public class JwtService(IConfiguration config) : IJwtService
{
    public string GenerateToken(Guid userId, string email, string username)
    {
        //Credentials are created using the configuration key
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt__Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.UniqueName, username),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var expiration = int.Parse(config["Jwt__ExpiresInMinutes"]!);

        var token = new JwtSecurityToken
        (
            issuer: config["Jwt__Issuer"],
            audience: config["Jwt__Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiration),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public (string Token, string Hash) GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        var token = Convert.ToBase64String(bytes);
        var hash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
        return(token, hash);
    }
}
