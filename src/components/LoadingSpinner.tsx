import React from "react";

//--------------------------------------

type ActionStatus = "loading" | "success" | "error" | "idle" 

export default function LoadingSpinner( {status, size, border, color} : {status?: ActionStatus, size?: number , border?: number , color?: string | undefined} = {status: "loading", size: 50, border: 10, color: undefined} ) {
	return (
		<>
		<div className="spinner-container">
			<div className="loading-spinner" style={{width : size, height : size, borderWidth : border}}></div>
		</div>

		{/* {"status: " + status}
		<UseAnimations
			strokeColor={color!==undefined? color : (status === "error" ? "red" : (status === "loading" ? "currentColor" : "green"))} 
			size={status === "error" ? size : (status === "loading" ? size : size)}
			animation={ status === "error" ? alertTriangleAnimation : (status === "loading" ? loadingAnimation : checkmarkAnimation)}
		/> 

		 */}

		</>
	);
}