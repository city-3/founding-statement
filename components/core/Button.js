export default function Button({primary, children, className, ...props}) {
  if (primary) {
    return <button className={"px-6 py-2 rounded-full bg-green-700 hover:bg-green-800 text-gray-bg text-sm md:text-base font-mono font-bold transition duration-250 ease-in-out " + className} {...props}>
      {children}
    </button>;
  } else {
    return <button className={"px-6 py-2 rounded-full text-fff hover:bg-gray-hover text-sm md:text-base font-mono font-bold transition duration-250 ease-in-out " + className} {...props}>
      {children}
    </button>;
  }
}
