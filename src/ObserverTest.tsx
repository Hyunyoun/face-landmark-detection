import React, {useEffect, useState} from "react";

import {AsyncSubject, interval, Observable, ReplaySubject, Subject} from "rxjs";
import {filter, take, tap} from "rxjs/operators";


const subject = new ReplaySubject(1);
// const subject = new AsyncSubject();

const intervalSource$ = interval(500).pipe(
  take(10),
  tap(x => console.log(`tap ${x}`))
);

const createHotObservable = (sourceObservable: Observable<any>, subject: Subject<any>) => {
  return {
    connect: () => sourceObservable.pipe(
      filter(value => value % 2 === 0),
    ).subscribe(subject),
    subscribe: subject.subscribe.bind(subject)
  };
}

const hotObservable = createHotObservable(intervalSource$, subject)
hotObservable.connect();

const Observe = () => {
  const [eyeValue, setEyeValue] = useState(0);
  const [mouthValue, setMouthValue] = useState(0);

  const setEyeValueWithLog = (value: number) => {
    console.log(`Eye value: ${value}`);
    setEyeValue(value);
  }
  const setMouthValueWithLog = (value: number) => {
    console.log(`Mouth value: ${value}`);
    setMouthValue(value);
  }

  useEffect(() => {
    hotObservable.subscribe(setEyeValueWithLog);
    console.log('Eye Observer Connected');

    setTimeout(() => {
      hotObservable.subscribe(setMouthValueWithLog);
      console.log('Mouth Observer Connected');
    }, 1000);

  }, []);

  return (
    <div>
      <p>Eye: {eyeValue}</p>
      <p>Mouth: {mouthValue}</p>
    </div>
  );
}

export default Observe;
