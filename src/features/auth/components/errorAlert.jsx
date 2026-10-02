export default function ErrorAlert({
    errorDescription,
    errorTitle,
    color = "orange"}) {

        const colors = {
            red: "bg-red-300 border-red-500 text-red-700",
            orange: "bg-orange-100 border-orange-500 text-orange-700",
        };

        return (<div className={`toast-enter fixed bottom-4 right-4 z-50 max-w-sm
                                ${colors[color]} 
                                p-4 rounded shadow-lg
                                text-3xl`}
                    role="alert"
                >
                        <div className='flex-1'>
                            <p className="font-bold">{errorTitle}</p>
                            <p>{errorDescription}</p>
                        </div>              
                </div>)
}