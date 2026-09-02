import React from 'react';

export default function Logo({
className = "h-10 w-auto",
showText = true
}) {
return ( <div className="flex items-center gap-2.5"> <svg
     viewBox="0 0 48 44"
     className={className}
     fill="none"
     xmlns="http://www.w3.org/2000/svg"
     role="img"
     aria-label="EntreNós"
   > <defs> <linearGradient
         id="logo-gradient-purple"
         x1="0"
         y1="44"
         x2="24"
         y2="0"
         gradientUnits="userSpaceOnUse"
       > <stop stopColor="#7559E6" /> <stop offset="1" stopColor="#9B7CF0" /> </linearGradient>

```
      <linearGradient
        id="logo-gradient-coral"
        x1="48"
        y1="44"
        x2="24"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FF9D8E" />
        <stop offset="1" stopColor="#FFB5A8" />
      </linearGradient>
    </defs>

    <path
      d="M6 16C6 10.477 10.477 6 16 6H20C25.523 6 30 10.477 30 16V26C30 28.209 28.209 30 26 30H16C10.477 30 6 25.523 6 20V16Z"
      fill="url(#logo-gradient-purple)"
    />

    <path
      d="M42 16C42 10.477 37.523 6 32 6H28C22.477 6 18 10.477 18 16V26C18 28.209 19.791 30 22 30H32C37.523 30 42 25.523 42 20V16Z"
      fill="url(#logo-gradient-coral)"
    />

    <circle
      cx="14"
      cy="9"
      r="4.5"
      fill="url(#logo-gradient-purple)"
    />

    <circle
      cx="34"
      cy="9"
      r="4.5"
      fill="url(#logo-gradient-coral)"
    />
  </svg>

  {showText && (
    <span
      className="font-heading font-bold text-xl tracking-tight"
      style={{ color: "hsl(240 25% 18%)" }}
    >
      Entre
      <span style={{ color: "hsl(258 70% 56%)" }}>
        Nós
      </span>
    </span>
  )}
</div>
```

);
}
