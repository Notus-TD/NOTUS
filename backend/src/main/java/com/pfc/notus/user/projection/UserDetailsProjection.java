package com.pfc.notus.user.projection;

public interface UserDetailsProjection {
    Long getId();
    String getUsername();
    String getPassword();
    Long getRoleId();
    String getAuthority();
}
