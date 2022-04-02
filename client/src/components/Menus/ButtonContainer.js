import React from "react";
import { PrimaryButton } from '../Buttons'

const ButtonContainer = ( { buttons, title } ) => {

    return (
        <>
        <section>
            <h2 className="container-title">{ title }</h2>
            <div className="container-grid-full">
                { buttons.map( ( x, i ) => {
                    return <PrimaryButton key={ `${i}_budget` } title={ x.title } desc={ x.desc } disabled={ x.disabled || false } link={ x.link }/>
                })}
            </div>
        </section>
        </>
    )
};

export default ButtonContainer;
