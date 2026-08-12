namespace MeetFlow.BLL.DTOs.Auth
{
    public class GoogleLoginDto
    {
        // The ID token Google's frontend SDK hands back after the user picks an account.
        // We verify this server-side — we never trust the frontend's word for who signed in.
        public string IdToken { get; set; } = null!;
    }
}
