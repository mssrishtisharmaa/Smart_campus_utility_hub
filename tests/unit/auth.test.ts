import { describe, it, expect } from 'vitest';
import { authFormSchema, authErrorMessage, credentialsSchema, registrationSchema, EMAIL_UNAVAILABLE } from '@/lib/auth-validation';
import { sessionCookieOptions } from '@/lib/session-cookies';

const input = {email:'  Explorer@Example.com ',password:'a long unique phrase',confirmPassword:'a long unique phrase',name:'Weather Explorer',persona:'citizen',remember:true};
describe('Account forms and sessions',()=>{
  it('normalizes addresses without modifying passwords',()=>{const result=credentialsSchema.parse(input);expect(result.email).toBe('explorer@example.com');expect(result.password).toBe(input.password);});
  it('keeps existing eight-character passwords valid for login but requires twelve for new accounts',()=>{expect(credentialsSchema.safeParse({...input,password:'12345678'}).success).toBe(true);expect(registrationSchema.safeParse({...input,password:'12345678'}).success).toBe(false);});
  it('rejects mismatched confirmation for registration and recovery',()=>{for(const mode of ['register','update-password'] as const)expect(authFormSchema(mode).safeParse({...input,confirmPassword:'different phrase'}).success).toBe(false);});
  it('recovery updates need no email or old password field',()=>{expect(authFormSchema('update-password').safeParse({...input,email:''}).success).toBe(true);});
  it('email request screens do not require password values',()=>{for(const mode of ['reset','resend'] as const)expect(authFormSchema(mode).safeParse({...input,password:'',confirmPassword:''}).success).toBe(true);});
  it('rejects administrator persona injection during signup',()=>{expect(registrationSchema.safeParse({...input,persona:'admin'}).success).toBe(false);});
  it('uses browser-session cookies when remember is off without breaking deletion',()=>{const options={path:'/',maxAge:604800,expires:new Date('2030-01-01')};expect(sessionCookieOptions(options,false)).toEqual({path:'/'});expect(sessionCookieOptions(options,true)).toBe(options);expect(sessionCookieOptions({maxAge:0,path:'/'},false).maxAge).toBe(0);});
  it('explains provider errors without exposing internal details',()=>{expect(authErrorMessage({code:'email_not_confirmed'},'fallback')).toContain('Confirm your email');expect(authErrorMessage({code:'email_address_not_authorized'},'fallback')).toBe(EMAIL_UNAVAILABLE);expect(authErrorMessage({status:429},'fallback')).toContain('Wait a minute');expect(authErrorMessage({code:'unknown'},'safe error')).toBe('safe error');});
});
