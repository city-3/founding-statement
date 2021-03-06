import Box from "./core/Box";
import Button from './core/Button';


const generateTweet = () => {
  const str = `I just signed the OAK founding statement - join me in signing and building a more prosperous, just, and regenerative Oakland: sign.oak.community`;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURI(str)}`);
}

export default function SocialProofConfirmation({ closeModal }) {
    return (
      <Box
        title={<p className="text-center"> Thank you for signing! </p>}
        includeBorder={false}
        content={
            <div className="mt-8 mb-6">
                <p className="font-mono text-center mx-6 mb-6">
                  Thank you for signing — we're excited to have you as a founding member of OAK!
                </p>

                <p className="font-mono text-gray-placeholder text-center text-xs">
                  Note: it may take a few minutes for your signature to show up.
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
