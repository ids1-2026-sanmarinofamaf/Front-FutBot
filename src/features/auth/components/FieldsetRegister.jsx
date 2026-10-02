export default function FieldsetRegister(
    {title,
     idFieldset,typeFieldset,
     onChangeFieldset, valueFieldset}){
    return(<fieldset className="contents">
                <label
                    htmlFor={idFieldset}
                    className="text-4xl font-extrabold text-transparent text-right
                                bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                >
                    {title}:
                </label>
                <input
                    id={idFieldset}
                    className="flex-1 min-w-0 border-2 py-2 px-3 rounded-md text-3xl text-emerald-400"
                    type= {typeFieldset}
                    onChange={onChangeFieldset}
                    value={valueFieldset}
                />
            </fieldset>);
}