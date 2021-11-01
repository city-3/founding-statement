export default function Button({primary, children, ...props}) {
  if (primary) {
    return <button className="mt-5 px-6 py-2 rounded-full bg-brown-20 bg-brown-20 text-white text-md font-mono" {...props}>
      {children}
    </button>
  } else {
    return <button className="ml-2.5 mt-5 px-6 py-2 rounded-full bg-gray-200 text-brown-120 text-md font-mono" {...props}>
      {children}
    </button>
  }
}