package com.pfc.notus.config;

import com.github.loki4j.slf4j.marker.LabelMarker;
import org.slf4j.Marker;

public final class AuditMarker {

    public static final Marker AUDIT = LabelMarker.of("type", () -> "audit");

    private AuditMarker() {
    }
}
