import React from "react";
import { PrimaryButton } from '../Buttons'
import { Title } from '../Layout'

const ButtonContainer = ( { buttons, title } ) => {

    return (
        <>
        <section>
            <Title text={ title } />
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
