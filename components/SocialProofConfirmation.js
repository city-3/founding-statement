import Box from "./core/Box";
import Button from './core/Button';


const generateTweet = () => {
  const str = `I just signed the OAK founding statement! sign.oak.community`;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURI(str)}`);
}

export default function SocialProofConfirmation({ closeModal }) {
    return (
      <Box
        title={<p className="text-center"> Thank you for signing! </p>}
        includeBorder={false}
        content={
            <div className="mt-8 mb-6">
                <p className="font-mono mx-6 mb-6">
                  We're excited you're a part of making Oakland, Oakland. {/* If you have a moment, please share what this vision means to you.*/}
                </p>
                
                <div className="mt-12 mb-3 text-center">
                  <Button
                  primary
                  onClick={generateTweet}>
                    Share
                  </Button>
                </div>
               
                <div className="text-center">
                  <button
                    className="font-mono underline font-light text-gray-400"
                    onClick={closeModal}>
                      Close
                  </button>
                </div>
          </div>}
      />
    );
  }
