package com.pfc.notus.user.projection;

public interface UserDetailsProjection {
    Long getId();
    String getUsername();
    String getPassword();
    Boolean getFirstLogin();
    Boolean getAtivo();
    Long getRoleId();
    String getAuthority();
}
