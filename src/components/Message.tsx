
export default function Message({message}:{message:string}) {

	return (
		<div className="section__text pool">
			<div className="pool__data">
				<div className="pool__data_item">
						<div className="pool__data_item">
							{message}
						</div>
				</div>
			</div>
		</div>
	)
}


