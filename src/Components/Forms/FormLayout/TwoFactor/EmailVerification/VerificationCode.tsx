import { Href, ImagePath, VerificationCodeTitle, Verify } from '@/Constant';
import { otpGenerate } from '@/Data/Forms/FormLayout';
import Image from 'next/image';
import React, { useState } from 'react'
import { Button, Col, Form, Input, Row } from 'reactstrap'

const VerificationCode = () => {
    const [val, setVal] = useState(Array(6).fill(''));
    const handleChange = (e: string, index: number) => {
        if (e.length > 1) return;
        else {
            const tempt = [...val];
            tempt[index] = e;
            setVal(tempt);
        }
    };
    return (
        <Col md={6}>
            <div className="card-wrapper border rounded-3 h-100">
                <div className="authenticate">
                    <h4>{VerificationCodeTitle}</h4>
                    <Image className="img-fluid" src={`${ImagePath}/forms/authenticate.png`} width={197} height={200} alt="authenticate" />
                    <span>{"We've sent a verification code to"}</span>
                    <span>{'+91********70'}</span>
                    <Form onSubmit={(event) => event.preventDefault()}>
                        <Row>
                            <Col><h5>{'Your OTP Code here:'}</h5></Col>
                            <Col className="otp-generate">
                                {otpGenerate.map((data, index) => (<Input key={data} value={val[index]} className="code-input" type="number" onChange={(e) => handleChange(e.target.value, index)} />))}
                            </Col>
                            <Col>
                                <Button color="primary" className="w-100">{Verify}</Button>
                            </Col>
                            <div>
                                <span>{"Not received your code?"}</span>
                                <span>
                                    <a href={Href}>{'Resend'} </a>{'OR'}<a href={Href}> {'Call'}</a>
                                </span>
                            </div>
                        </Row>
                    </Form>
                </div>
            </div>
        </Col>
    )
}
export default VerificationCode;