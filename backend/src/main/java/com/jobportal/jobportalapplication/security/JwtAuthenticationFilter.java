package com.jobportal.jobportalapplication.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        System.out.println("=== JWT FILTER START ===");
        System.out.println("Request URI: " + request.getRequestURI());
        System.out.println("Method: " + request.getMethod());

        try {
            String jwt = getJwtFromRequest(request);
            System.out.println("JWT Token extracted: " + (jwt != null ? "YES (length: " + jwt.length() + ")" : "NO"));

            if (jwt != null) {
                System.out.println("Validating token...");
                boolean isValid = tokenProvider.validateToken(jwt);
                System.out.println("Token valid: " + isValid);

                if (isValid) {
                    String email = tokenProvider.getUsernameFromToken(jwt);
                    System.out.println("Email from token: " + email);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    System.out.println("UserDetails loaded: " + userDetails.getUsername());
                    System.out.println("Authorities: " + userDetails.getAuthorities());

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    System.out.println("Authentication set in SecurityContext");
                } else {
                    System.out.println("Token validation failed");
                }
            } else {
                System.out.println("No JWT token found in request");
            }
        } catch (Exception e) {
            System.err.println("JWT Filter Exception: " + e.getMessage());
            e.printStackTrace();
        }

        System.out.println("=== JWT FILTER END ===\n");
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        System.out.println("Authorization Header: " + (bearerToken != null ? bearerToken.substring(0, Math.min(30, bearerToken.length())) + "..." : "NULL"));

        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            System.out.println("Extracted token (first 20 chars): " + token.substring(0, Math.min(20, token.length())) + "...");
            return token;
        }
        return null;
    }
}