const GoogleButton = ({ text = "Continue with Google" }) => {
    const handleGoogleAuth = () => {
        const baseUrl = meta.env.VITE_API_URL || 'http://localhost:4000/api'
        window.location.href = `${baseUrl}/auth/google`;
    }

    return (
        <button 
            onClick={handleGoogleAuth}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 py-3 font-semibold transition hover:bg-gray-50 active:scale-98"
        >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
            <span>{text}</span>
        </button>
    )
}

export default GoogleButton