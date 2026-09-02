import React from 'react';

export default function Logo({
className = "h-10 w-auto",
showText = true
}) {
return ( <div className="flex items-center gap-2.5">
<img
src="/logo.png"
alt="EntreNós"
className={`${className} object-contain`}
/>

```
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
