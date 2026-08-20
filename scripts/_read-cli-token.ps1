Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CredMan {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct CREDENTIAL {
    public int Flags; public int Type; public string TargetName; public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist; public int AttributeCount;
    public IntPtr Attributes; public string TargetAlias; public string UserName;
  }
  [DllImport("advapi32", SetLastError = true, CharSet = CharSet.Unicode)]
  public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
  [DllImport("advapi32", SetLastError = true)] public static extern bool CredFree(IntPtr cred);
}
"@
$ptr = [IntPtr]::Zero
if (-not [CredMan]::CredRead('Supabase CLI:supabase', 1, 0, [ref]$ptr)) { exit 1 }
$c = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][CredMan+CREDENTIAL])
$bytes = New-Object byte[] $c.CredentialBlobSize
[Runtime.InteropServices.Marshal]::Copy($c.CredentialBlob, $bytes, 0, $c.CredentialBlobSize)
[Console]::Out.Write([Text.Encoding]::UTF8.GetString($bytes).Trim([char]0))
[CredMan]::CredFree($ptr) | Out-Null
