import { SignIn } from "@clerk/nextjs";

export default function SignInComponent() {
  return (
    <div>
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
