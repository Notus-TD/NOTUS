package com.pfc.notus.user.projection;

public interface UserDetailsProjection {
    Long getId();
    String getUsername();
    String getPassword();
    Boolean getFirstLogin();
    Boolean getAtivo();
    Boolean getAcessoLiberado();
    Long getRoleId();
    String getAuthority();
}
